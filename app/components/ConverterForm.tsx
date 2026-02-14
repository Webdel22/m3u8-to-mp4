
'use client';

import { useState, useEffect } from 'react';
import { Loader2, Download, AlertCircle, FileVideo, CheckCircle } from 'lucide-react';

export default function ConverterForm() {
    const [url, setUrl] = useState('');
    const [jobId, setJobId] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setStatus('pending');
        setError(null);
        setProgress(0);

        try {
            const res = await fetch('/api/convert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            if (!res.ok) throw new Error('Failed to start conversion');

            const data = await res.json();
            setJobId(data.id);
            setStatus('processing');
        } catch (err: any) {
            setStatus('error');
            setError(err.message || 'Something went wrong');
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (jobId && (status === 'processing' || status === 'pending')) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/status/${jobId}`);
                    if (!res.ok) {
                        // If 404, maybe job lost (server restart), stop polling
                        if (res.status === 404) {
                            setStatus('error');
                            setError('Job not found (server might have restarted)');
                            setJobId(null);
                            return;
                        }
                        return;
                    }
                    const data = await res.json();

                    if (data.status === 'completed') {
                        setStatus('completed');
                        setProgress(100);
                        clearInterval(interval);
                    } else if (data.status === 'error') {
                        setStatus('error');
                        setError(data.error || 'Conversion failed');
                        clearInterval(interval);
                    } else {
                        setStatus(data.status);
                        if (data.progress) setProgress(data.progress);
                    }
                } catch (err) {
                    console.error('Polling error:', err);
                }
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [jobId, status]);

    const downloadUrl = jobId ? `/api/download/${jobId}` : null;

    return (
        <div className="w-full max-w-2xl mx-auto p-6 space-y-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl">
            <div className="space-y-2 text-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    M3U8 to MP4 Converter
                </h2>
                <p className="text-gray-400">Convert streaming videos to MP4 format instantly</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative group">
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Enter .m3u8 URL here..."
                        className="w-full px-6 py-4 bg-gray-900/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-100 placeholder-gray-500 group-hover:border-gray-600"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <FileVideo className="text-gray-500 w-5 h-5" />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={status === 'processing' || status === 'pending' || !url}
                    className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                    {status === 'processing' || status === 'pending' ? (
                        <>
                            <Loader2 className="animate-spin w-5 h-5" />
                            Converting...
                        </>
                    ) : (
                        'Start Conversion'
                    )}
                </button>
            </form>

            {/* Status Cards */}
            {status !== 'idle' && (
                <div className={`p-6 rounded-xl border ${status === 'completed' ? 'bg-green-500/10 border-green-500/20' :
                        status === 'error' ? 'bg-red-500/10 border-red-500/20' :
                            'bg-blue-500/10 border-blue-500/20'
                    } transition-all duration-500`}>

                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            {status === 'completed' ? <CheckCircle className="text-green-500 w-6 h-6" /> :
                                status === 'error' ? <AlertCircle className="text-red-500 w-6 h-6" /> :
                                    <Loader2 className="text-blue-500 w-6 h-6 animate-spin" />}
                            <span className="font-medium text-gray-200 capitalize">
                                {status === 'completed' ? 'Conversion Successful' :
                                    status === 'error' ? 'Conversion Failed' :
                                        'Processing Video...'}
                            </span>
                        </div>
                        <span className="text-sm font-mono text-gray-400">{progress}%</span>
                    </div>

                    {(status === 'processing' || status === 'pending') && (
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-blue-500 h-full rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}

                    {status === 'completed' && downloadUrl && (
                        <a
                            href={downloadUrl}
                            download
                            className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                        >
                            <Download className="w-5 h-5" />
                            Download MP4
                        </a>
                    )}

                    {status === 'error' && (
                        <div className="mt-2 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
