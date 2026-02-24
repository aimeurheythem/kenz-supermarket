import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { AuditLog } from '@/stores/useAuditLogStore';
import { useAuditLogStore } from '@/stores/useAuditLogStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TableSkeletonCells } from '@/components/common/TableSkeleton';
import Pagination from '@/components/common/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { Search, Eye, X, Activity, User, Clock, FileText, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { usePageTitle } from '@/hooks/usePageTitle';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function AuditLogs() {
    const { t } = useTranslation();
    usePageTitle(t('sidebar.audit_logs'));
    const { logs, isLoading: loading, loadLogs: storeLoadLogs } = useAuditLogStore();
    const [filters, setFilters] = useState({
        entity: 'ALL',
        action: 'ALL',
        search: '',
    });
    const [_selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const loadLogs = useCallback(async () => {
        const repoFilters: any = {};
        if (filters.entity !== 'ALL') repoFilters.entity = filters.entity;
        if (filters.action !== 'ALL') repoFilters.action = filters.action;
        await storeLoadLogs({ ...repoFilters, limit: 100 });
    }, [filters, storeLoadLogs]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const filteredLogs = logs.filter(
        (log) =>
            !filters.search ||
            log.details?.toLowerCase().includes(filters.search.toLowerCase()) ||
            log.user_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
            log.entity?.toLowerCase().includes(filters.search.toLowerCase()),
    );

    const { currentPage, totalPages, startIndex, endIndex, setCurrentPage, paginate, resetPage } = usePagination({
        totalItems: filteredLogs.length,
    });

    useEffect(() => {
        resetPage();
    }, [filters, resetPage]);

    const paginatedLogs = paginate(filteredLogs);

    const totalLogs = logs.length;
    const todayLogs = logs.filter((log) => {
        const logDate = new Date(log.created_at).toDateString();
        return logDate === new Date().toDateString();
    }).length;
    const uniqueUsers = [...new Set(logs.map((log) => log.user_name).filter(Boolean))].length;

    return (
        <div className="relative flex flex-col items-start gap-8 p-6 lg:p-8 animate-fadeIn mt-4">
            {/* Grid Background */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.15] rounded-[3rem]"
                style={{
                    backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                    maskImage: 'radial-gradient(circle at top center, black, transparent 90%)',
                    WebkitMaskImage: 'radial-gradient(circle at top center, black, transparent 90%)',
                }}
            />

            <div className="relative z-10 flex-1 flex flex-col min-w-0 w-full">
                {/* Header Section */}
                <div className="flex flex-col space-y-6 pb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <span className="text-[12px] text-zinc-400 tracking-[0.3em] font-bold">
                                {t('sidebar.audit_logs')}
                            </span>
                            <h2 className="text-3xl font-black text-black tracking-tighter uppercase">
                                {t('audit_logs.title')}
                            </h2>
                        </div>
                        <button
                            onClick={loadLogs}
                            className="flex items-center gap-2 px-4 py-3 bg-yellow-400 text-black rounded-3xl transition-all cursor-pointer active:scale-105"
                        >
                            <RefreshCw size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {t('audit_logs.refresh')}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-yellow-300 border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-36 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-black/60 uppercase tracking-widest">
                                {t('audit_logs.stat_total')}
                            </span>
                            <div className="p-2 bg-black/5 rounded-full">
                                <Activity size={14} className="text-black" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <span className="text-2xl font-black text-black tracking-tighter">
                                {totalLogs.toLocaleString()}
                            </span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-white border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-36 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                {t('audit_logs.stat_today')}
                            </span>
                            <div className="p-2 bg-zinc-100 rounded-full">
                                <Clock size={14} className="text-zinc-500" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-black tracking-tighter">{todayLogs}</span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">Today</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-black text-white border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-36 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 p-24 bg-zinc-800 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2" />
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                {t('audit_logs.stat_users')}
                            </span>
                            <div className="p-2 bg-white/10 rounded-full">
                                <User size={14} className="text-white" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-white tracking-tighter">{uniqueUsers}</span>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase">Users</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Search Bar & Filters */}
                <div className="flex flex-col lg:flex-row items-center gap-4 mb-6">
                    <div className="relative group flex-1 w-full">
                        <Search
                            size={22}
                            className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors"
                        />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                            placeholder={t('audit_logs.search_placeholder')}
                            className={cn(
                                'w-full pl-16 pr-16 py-4 rounded-3xl',
                                'bg-white border border-zinc-200 shadow-none',
                                'text-black placeholder:text-zinc-300 text-base font-bold',
                                'focus:outline-none focus:ring-0 focus:!outline-none focus-visible:!outline-none focus-visible:ring-0 focus:border-zinc-400 transition-all placeholder:transition-opacity focus:placeholder:opacity-50',
                            )}
                        />
                        {filters.search && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={() => {
                                    setFilters((prev) => ({ ...prev, search: '' }));
                                    searchInputRef.current?.focus();
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-zinc-100 text-zinc-400 hover:bg-black hover:text-white transition-all duration-300"
                            >
                                <X size={16} strokeWidth={3} />
                            </motion.button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <Select
                            value={filters.entity}
                            onValueChange={(v) => setFilters((prev) => ({ ...prev, entity: v }))}
                        >
                            <SelectTrigger className="w-[140px] h-12 bg-white border-zinc-200 rounded-xl !ring-0 font-bold text-sm">
                                <SelectValue placeholder={t('audit_logs.entity_label')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">{t('audit_logs.all_entities')}</SelectItem>
                                <SelectItem value="PRODUCT">{t('audit_logs.entity_product')}</SelectItem>
                                <SelectItem value="SETTINGS">{t('audit_logs.entity_settings')}</SelectItem>
                                <SelectItem value="USER">{t('audit_logs.entity_user')}</SelectItem>
                                <SelectItem value="ORDER">{t('audit_logs.entity_order')}</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.action}
                            onValueChange={(v) => setFilters((prev) => ({ ...prev, action: v }))}
                        >
                            <SelectTrigger className="w-[140px] h-12 bg-white border-zinc-200 rounded-xl !ring-0 font-bold text-sm">
                                <SelectValue placeholder={t('audit_logs.action_label')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">{t('audit_logs.all_actions')}</SelectItem>
                                <SelectItem value="CREATE">{t('audit_logs.action_create')}</SelectItem>
                                <SelectItem value="UPDATE">{t('audit_logs.action_update')}</SelectItem>
                                <SelectItem value="DELETE">{t('audit_logs.action_delete')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="rounded-[3rem] bg-white border-2 border-black/5 overflow-hidden">
                    <table className="w-full" dir="auto">
                        <thead className="bg-zinc-50 border-b border-zinc-100">
                            <tr>
                                <th className="px-6 py-4 rtl:text-right ltr:text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 w-[180px]">
                                    {t('audit_logs.col_timestamp')}
                                </th>
                                <th className="px-6 py-4 rtl:text-right ltr:text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('audit_logs.col_user')}
                                </th>
                                <th className="px-6 py-4 rtl:text-right ltr:text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('audit_logs.col_action')}
                                </th>
                                <th className="px-6 py-4 rtl:text-right ltr:text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('audit_logs.col_entity')}
                                </th>
                                <th className="px-6 py-4 rtl:text-right ltr:text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('audit_logs.col_details')}
                                </th>
                                <th className="px-6 py-4 rtl:text-left ltr:text-right text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('audit_logs.col_view')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <TableSkeletonCells columns={6} rows={6} />
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center">
                                                <FileText size={24} className="text-zinc-300" />
                                            </div>
                                            <p className="text-sm font-bold text-zinc-400">{t('audit_logs.no_logs')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
                                        <td className="px-6 py-4 rtl:text-right ltr:text-left">
                                            <span className="text-sm font-bold text-black">
                                                {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 rtl:text-right ltr:text-left">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600">
                                                    {log.user_name?.[0] || '?'}
                                                </div>
                                                <span className="text-sm font-medium text-zinc-600">
                                                    {log.user_name || t('audit_logs.system_user')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 rtl:text-right ltr:text-left">
                                            <span
                                                className={cn(
                                                    'inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                                                    log.action === 'CREATE' && 'bg-emerald-100 text-emerald-700',
                                                    log.action === 'DELETE' && 'bg-rose-100 text-rose-700',
                                                    log.action === 'UPDATE' && 'bg-blue-100 text-blue-700',
                                                )}
                                            >
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 rtl:text-right ltr:text-left">
                                            <span className="text-xs font-bold bg-zinc-100 px-3 py-1 rounded-full text-zinc-600 uppercase tracking-wider">
                                                {log.entity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 rtl:text-right ltr:text-left">
                                            <span className="text-sm text-zinc-500 truncate max-w-[300px] block">
                                                {log.details}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end rtl:justify-start">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <button
                                                            onClick={() => setSelectedLog(log)}
                                                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 hover:bg-black hover:text-white transition-all"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-[2rem]">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-xl font-bold text-black tracking-tight">
                                                                {t('audit_logs.log_details')}
                                                            </DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-6 pt-4">
                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <div className="p-4 bg-zinc-50 rounded-xl">
                                                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                                                        {t('audit_logs.label_timestamp')}
                                                                    </label>
                                                                    <p className="font-bold text-black mt-1">
                                                                        {format(new Date(log.created_at), 'PPP pp')}
                                                                    </p>
                                                                </div>
                                                                <div className="p-4 bg-zinc-50 rounded-xl">
                                                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                                                        {t('audit_logs.label_user')}
                                                                    </label>
                                                                    <p className="font-bold text-black mt-1">
                                                                        {log.user_name || t('audit_logs.system_user')}{' '}
                                                                        <span className="text-zinc-400 font-normal">
                                                                            (ID: {log.user_id})
                                                                        </span>
                                                                    </p>
                                                                </div>
                                                                <div className="p-4 bg-zinc-50 rounded-xl col-span-2">
                                                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                                                        {t('audit_logs.label_action')}
                                                                    </label>
                                                                    <p className="font-bold text-black mt-1">
                                                                        {log.action} on {log.entity} #{log.entity_id}
                                                                    </p>
                                                                </div>
                                                                <div className="col-span-2 p-4 bg-zinc-50 rounded-xl">
                                                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                                                        {t('audit_logs.label_description')}
                                                                    </label>
                                                                    <p className="text-zinc-700 mt-1">{log.details}</p>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <h4 className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-3">
                                                                        {t('audit_logs.label_old_value')}
                                                                    </h4>
                                                                    <pre className="text-xs font-mono bg-rose-50 p-4 rounded-xl overflow-x-auto text-rose-900 min-h-[100px] border border-rose-100">
                                                                        {log.old_value
                                                                            ? JSON.stringify(log.old_value, null, 2)
                                                                            : 'null'}
                                                                    </pre>
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3">
                                                                        {t('audit_logs.label_new_value')}
                                                                    </h4>
                                                                    <pre className="text-xs font-mono bg-emerald-50 p-4 rounded-xl overflow-x-auto text-emerald-900 min-h-[100px] border border-emerald-100">
                                                                        {log.new_value
                                                                            ? JSON.stringify(log.new_value, null, 2)
                                                                            : 'null'}
                                                                    </pre>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="px-6 pb-6">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredLogs.length}
                            startIndex={startIndex}
                            endIndex={endIndex}
                            onPageChange={setCurrentPage}
                            itemLabel={t('audit_logs.title')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
