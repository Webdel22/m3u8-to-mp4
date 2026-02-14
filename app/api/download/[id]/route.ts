
import { NextRequest, NextResponse } from 'next/server';
import { jobs } from '@/lib/jobs';
import fs from 'fs';
import path from 'path';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = params.id;
    const job = jobs.get(id);

    if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'completed' || !job.outputFile || !fs.existsSync(job.outputFile)) {
        return NextResponse.json({ error: 'File not ready or missing' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(job.outputFile);

    // Create headers
    const headers = new Headers();
    headers.set('Content-Type', 'video/mp4');
    headers.set('Content-Disposition', `attachment; filename="video_${id}.mp4"`);

    return new NextResponse(fileBuffer, {
        status: 200,
        headers,
    });
}
