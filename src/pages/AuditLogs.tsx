import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { query } from '@/../database/db'; // Correct path to existing db module
import { AuditLog, AuditLogRepo } from '@/../database/repositories/audit-log.repo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Filter, Eye, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

// Mock function for now if repo isn't directly accessible in frontend
// In a real app we'd use an API or Bridge. Since this is Electron/Local, we might use the Repo directly if allowed, 
// or validatethe architecture.
// Assuming we can import Repo for now as per other pages.

export default function AuditLogs() {
    const { t } = useTranslation();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        entity: 'ALL',
        action: 'ALL',
        search: ''
    });
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const loadLogs = async () => {
        setLoading(true);
        try {
            // Adapt filters
            const repoFilters: any = {};
            if (filters.entity !== 'ALL') repoFilters.entity = filters.entity;
            if (filters.action !== 'ALL') repoFilters.action = filters.action;

            const result = await AuditLogRepo.getLogs({ ...repoFilters, limit: 100 });
            setLogs(result.logs);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [filters]);

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Audit Logs</h1>
                    <p className="text-zinc-500">Track system changes and user actions</p>
                </div>
                <Button variant="outline" onClick={loadLogs}>Refresh</Button>
            </div>

            <Card className="border-zinc-200 shadow-sm rounded-xl">
                <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 pb-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                            <Input
                                placeholder="Search details..."
                                className="pl-9 bg-white"
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={filters.entity} onValueChange={(v) => setFilters(prev => ({ ...prev, entity: v }))}>
                                <SelectTrigger className="w-[150px] bg-white">
                                    <SelectValue placeholder="Entity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Entities</SelectItem>
                                    <SelectItem value="PRODUCT">Product</SelectItem>
                                    <SelectItem value="SETTINGS">Settings</SelectItem>
                                    <SelectItem value="USER">User</SelectItem>
                                    <SelectItem value="ORDER">Order</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filters.action} onValueChange={(v) => setFilters(prev => ({ ...prev, action: v }))}>
                                <SelectTrigger className="w-[150px] bg-white">
                                    <SelectValue placeholder="Action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Actions</SelectItem>
                                    <SelectItem value="CREATE">Create</SelectItem>
                                    <SelectItem value="UPDATE">Update</SelectItem>
                                    <SelectItem value="DELETE">Delete</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-zinc-50/50">
                                    <TableHead className="w-[180px]">Timestamp</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Entity</TableHead>
                                    <TableHead className="w-[40%]">Details</TableHead>
                                    <TableHead className="text-right">View</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                                            Loading logs...
                                        </TableCell>
                                    </TableRow>
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                                            No logs found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log.id} className="hover:bg-zinc-50/50">
                                            <TableCell className="font-mono text-xs text-zinc-500">
                                                {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600">
                                                        {log.user_name?.[0] || '?'}
                                                    </div>
                                                    <span className="text-sm font-medium">{log.user_name || 'System'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                                                    log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {log.action}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs font-mono bg-zinc-100 px-2 py-1 rounded text-zinc-700">
                                                    {log.entity}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-zinc-600 truncate max-w-[300px]">
                                                {log.details}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                                                            <Eye size={16} className="text-zinc-400 hover:text-zinc-900" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                                                        <DialogHeader>
                                                            <DialogTitle>Log Details</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-6 pt-4">
                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <div>
                                                                    <label className="text-xs font-bold text-zinc-400 uppercase">Timestamp</label>
                                                                    <p className="font-mono">{format(new Date(log.created_at), 'PPP pp')}</p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs font-bold text-zinc-400 uppercase">User</label>
                                                                    <p>{log.user_name || 'System'} (ID: {log.user_id})</p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs font-bold text-zinc-400 uppercase">Action</label>
                                                                    <p>{log.action} on {log.entity} #{log.entity_id}</p>
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <label className="text-xs font-bold text-zinc-400 uppercase">Description</label>
                                                                    <p className="text-zinc-700">{log.details}</p>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                                                                <div>
                                                                    <h4 className="text-xs font-bold text-red-500 uppercase mb-2 flex items-center gap-2">
                                                                        Old Value
                                                                    </h4>
                                                                    <pre className="text-xs font-mono bg-red-50/50 p-3 rounded-lg overflow-x-auto text-red-900 min-h-[100px]">
                                                                        {log.old_value ? JSON.stringify(log.old_value, null, 2) : 'null'}
                                                                    </pre>
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-xs font-bold text-green-500 uppercase mb-2 flex items-center gap-2">
                                                                        New Value
                                                                    </h4>
                                                                    <pre className="text-xs font-mono bg-green-50/50 p-3 rounded-lg overflow-x-auto text-green-900 min-h-[100px]">
                                                                        {log.new_value ? JSON.stringify(log.new_value, null, 2) : 'null'}
                                                                    </pre>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
