
import { NextRequest, NextResponse } from 'next/server';
import { jobs } from '@/lib/jobs';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import os from 'os';
import fs from 'fs';

// Configure fluent-ffmpeg to use the static binary
let binaryPath = ffmpegPath;

// Robust path detection for different environments (Local Dev, Vercel, etc.)
if (!binaryPath || !fs.existsSync(binaryPath)) {
    const isWindows = os.platform() === 'win32';
    const ffmpegFileName = isWindows ? 'ffmpeg.exe' : 'ffmpeg';

    const possiblePaths = [
        // Try node_modules directly
        path.join(process.cwd(), 'node_modules', 'ffmpeg-static', ffmpegFileName),
        // Try absolute path if in a specific environment
        path.join('/var/task', 'node_modules', 'ffmpeg-static', ffmpegFileName),
        // Fallback to system ffmpeg if available
        ffmpegFileName
    ];

    for (const p of possiblePaths) {
        if (p === ffmpegFileName || fs.existsSync(p)) {
            binaryPath = p;
            break;
        }
    }
}

if (binaryPath) {
    ffmpeg.setFfmpegPath(binaryPath);
    console.log(`FFmpeg path set to: ${binaryPath}`);
} else {
    console.error("ffmpeg-static binary not found in any expected location");
}


export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const id = uuidv4();
        const tempDir = os.tmpdir();
        const outputFile = path.join(tempDir, `${id}.mp4`);

        // Initialize job
        jobs.set(id, {
            id,
            url,
            status: 'pending',
            progress: 0,
        });

        // Start conversion in background (do not await)
        processConversion(id, url, outputFile);

        return NextResponse.json({ id });
    } catch (error) {
        console.error('Error starting conversion:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function processConversion(id: string, url: string, outputFile: string) {
    const job = jobs.get(id);
    if (!job) return;

    job.status = 'processing';
    jobs.set(id, job);

    // Use fluent-ffmpeg to convert
    ffmpeg(url)
        .outputOptions('-c:v copy') // try to copy video codec if possible for speed
        .outputOptions('-c:a copy') // copy audio codec
        .outputOptions('-bsf:a aac_adtstoasc') // crucial for m3u8 to mp4 if audio is aac
        // If copy fails (e.g. incompatible codecs), remove .outputOptions('-c:v copy') and let it re-encode (slower)
        // For general m3u8 to mp4, re-encoding might be safer but copying is much faster.
        // Let's try copy first. If it fails, user can retry or we can fallback (complex).
        // Actually, safest generic approach for m3u8 is usually re-encoding or at least stream copying.
        // -c copy is standard for HLS to MP4 if the stream is already h264/aac.
        .on('progress', (progress) => {
            // progress.percent is not always reliable for streams with unknown duration
            // But we can try.
            if (progress.percent) {
                job.progress = Math.round(progress.percent);
            } else {
                // If percent is unavailable, valid m3u8 might show timemark.
                // We can't easily calculate percent without total duration.
                // For now, we might just set it to non-zero or estimate.
                // Or simpler: just say "Processing".
                // Let's stick to progress.percent if available.
                console.log('Progress:', progress.timemark);
            }
            jobs.set(id, job);
        })
        .on('end', () => {
            job.status = 'completed';
            job.progress = 100;
            job.outputFile = outputFile;
            jobs.set(id, job);
            console.log(`Job ${id} completed`);
        })
        .on('error', (err) => {
            console.error(`Job ${id} failed:`, err);
            job.status = 'error';
            job.error = err.message;
            jobs.set(id, job);
        })
        .save(outputFile);
}
