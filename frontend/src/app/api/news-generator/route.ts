import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
    generateAllReports,
    FlashReportsCache
} from '@/lib/analysis-generator';

export async function POST(request: NextRequest) {
    try {
        // Generate all flash reports from PX data
        const reports = await generateAllReports();

        if (reports.length === 0) {
            return NextResponse.json({
                error: 'Nenhum dado disponível para gerar relatórios',
                generated: 0
            }, { status: 404 });
        }

        // Create cache object
        const cache: FlashReportsCache = {
            metadata: {
                last_updated: new Date().toISOString(),
                report_count: reports.length,
            },
            reports,
        };

        // Save to public/data/flash_reports.json
        const cachePath = path.join(process.cwd(), 'public', 'data', 'flash_reports.json');

        try {
            fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf-8');
        } catch (writeError) {
            console.error('Error writing cache file:', writeError);
        }

        return NextResponse.json({
            success: true,
            generated: reports.length,
            reports: reports.map(r => ({
                id: r.id,
                indicator: r.indicator,
                headline: r.headline
            })),
            cached_at: cache.metadata.last_updated,
        });

    } catch (error) {
        console.error('Flash report generator error:', error);
        return NextResponse.json({
            error: 'Erro ao gerar relatórios',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// GET endpoint to retrieve cached reports
export async function GET() {
    try {
        const cachePath = path.join(process.cwd(), 'public', 'data', 'flash_reports.json');

        if (!fs.existsSync(cachePath)) {
            return NextResponse.json({
                metadata: { last_updated: null, report_count: 0 },
                reports: [],
                message: 'Nenhum relatório gerado ainda. Use POST para gerar.'
            });
        }

        const cacheContent = fs.readFileSync(cachePath, 'utf-8');
        const cache: FlashReportsCache = JSON.parse(cacheContent);

        return NextResponse.json(cache);
    } catch (error) {
        console.error('Error reading cache:', error);
        return NextResponse.json({
            error: 'Erro ao ler cache de relatórios'
        }, { status: 500 });
    }
}
