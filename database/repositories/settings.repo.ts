import { query, executeNoSave, triggerSave, get } from '../db';

import { AuditLogRepo } from './audit-log.repo';

export interface AppSettings {
    [key: string]: string;
}

export const SettingsRepo = {
    async getAll(): Promise<AppSettings> {
        const rows = await query<{ key: string; value: string }>('SELECT key, value FROM app_settings');
        const settings: AppSettings = {};
        rows.forEach((row) => {
            settings[row.key] = row.value;
        });
        return settings;
    },

    async get(key: string): Promise<string | null> {
        const row = await get<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', [key]);
        return row ? row.value : null;
    },

    async set(key: string, value: string): Promise<void> {
        const oldValue = await this.get(key);

        await executeNoSave(
            `INSERT INTO app_settings (key, value, updated_at) 
             VALUES (?, ?, datetime('now')) 
             ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')`,
            [key, value, value],
        );
        await triggerSave();

        // Audit
        await AuditLogRepo.log('UPDATE', 'SETTINGS', key, `Updated setting: ${key}`, { value: oldValue }, { value });
    },

    async setMany(settings: AppSettings): Promise<void> {
        const oldSettings = await this.getAll();
        const changes: { key: string; old: string | null; new: string }[] = [];

        try {
            await executeNoSave('BEGIN TRANSACTION;');

            const entries = Object.entries(settings);
            for (const [key, value] of entries) {
                if (oldSettings[key] !== value) {
                    changes.push({ key, old: oldSettings[key] || null, new: value });
                    await executeNoSave(
                        `INSERT INTO app_settings (key, value, updated_at) 
                         VALUES (?, ?, datetime('now')) 
                         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')`,
                        [key, value, value],
                    );
                }
            }

            await executeNoSave('COMMIT;');
            triggerSave();
        } catch (error) {
            await executeNoSave('ROLLBACK;');
            throw error;
        }

        // Batch Log (outside transaction — non-critical)
        if (changes.length > 0) {
            await AuditLogRepo.log(
                'UPDATE_BATCH',
                'SETTINGS',
                'BATCH',
                `Updated ${changes.length} settings`,
                changes.map((c) => ({ key: c.key, value: c.old })),
                changes.map((c) => ({ key: c.key, value: c.new })),
            );
        }
    },
};
