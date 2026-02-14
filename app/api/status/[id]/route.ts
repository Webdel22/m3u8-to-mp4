
import { NextRequest, NextResponse } from 'next/server';
import { jobs } from '@/lib/jobs';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = params.id;
    const job = jobs.get(id);

    if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
        id: job.id,
        status: job.status,
        progress: job.progress,
        error: job.error,
    });
}
