'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CameraScanner from '@/components/CameraScanner';
import OCRProcessor from '@/components/OCRProcessor';
import { performOCR } from '@/lib/ocr';
import { saveCard, BusinessCard } from '@/lib/storage';
import { ArrowLeft, Camera, RotateCcw } from 'lucide-react';

export default function ScanPage() {
  const router = useRouter();
  const [state, setState] = useState<'scanning' | 'preview' | 'processing' | 'done'>('scanning');
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<{
    companyName: string; fullName: string; phoneNumber: string; email: string; address: string;
  } | null>(null);

  const handleCapture = useCallback(async (imageData: string) => {
    setCapturedImage(imageData);
    setState('processing');
    setOcrProgress(10);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setOcrProgress(p => Math.min(p + 15, 90));
      }, 500);

      const data = await performOCR(imageData);
      clearInterval(progressInterval);
      setOcrProgress(100);
      setExtractedData(data);
      setState('preview');
    } catch (err) {
      console.error(err);
      setState('preview');
      setExtractedData({ companyName: '', fullName: '', phoneNumber: '', email: '', address: '' });
    }
  }, []);

  const handleSave = async () => {
    if (!extractedData) return;
    const card: BusinessCard = {
      id: crypto.randomUUID(),
      imageData: capturedImage,
      companyName: extractedData.companyName,
      fullName: extractedData.fullName,
      phoneNumber: extractedData.phoneNumber,
      email: extractedData.email,
      address: extractedData.address,
      rawText: '',
      createdAt: Date.now(),
      source: 'scan',
    };
    await saveCard(card);
    router.push('/');
  };

  const handleRetry = () => {
    setCapturedImage('');
    setExtractedData(null);
    setState('scanning');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <span className="text-white font-medium">名刺をスキャン</span>
        <div className="w-10" />
      </div>

      {state === 'scanning' && (
        <div className="flex-1 h-screen">
          <CameraScanner onCapture={handleCapture} />
        </div>
      )}

      {state === 'processing' && (
        <>
          <div className="flex-1 relative h-screen">
            {capturedImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={capturedImage} alt="captured" className="w-full h-full object-cover" />
            )}
          </div>
          <OCRProcessor progress={ocrProgress} />
        </>
      )}

      {state === 'preview' && extractedData && (
        <div className="flex-1 overflow-y-auto bg-[#0f0f1a]">
          <div className="pt-24 px-4">
            {/* Card image preview */}
            <div className="rounded-2xl overflow-hidden mb-6 border border-gray-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedImage} alt="名刺" className="w-full object-contain max-h-52" />
            </div>

            {/* Extracted data (editable) */}
            <h2 className="text-white font-bold text-lg mb-4">抽出された情報</h2>

            {[
              { label: '会社名', key: 'companyName', value: extractedData.companyName },
              { label: '氏名', key: 'fullName', value: extractedData.fullName },
              { label: '携帯電話', key: 'phoneNumber', value: extractedData.phoneNumber },
              { label: 'メール', key: 'email', value: extractedData.email },
              { label: '住所', key: 'address', value: extractedData.address },
            ].map(field => (
              <div key={field.key} className="mb-4">
                <label className="text-gray-400 text-xs font-medium mb-1.5 block">{field.label}</label>
                <input
                  type="text"
                  defaultValue={field.value}
                  onChange={e => setExtractedData(prev => prev ? { ...prev, [field.key]: e.target.value } : null)}
                  className="w-full bg-[#1a1a2e] text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-indigo-500"
                  placeholder={`${field.label}を入力`}
                />
              </div>
            ))}

            {/* Actions */}
            <div className="flex gap-3 mb-8 mt-6">
              <button
                onClick={handleRetry}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-700 text-white py-3.5 rounded-2xl font-medium"
              >
                <RotateCcw size={18} />
                再スキャン
              </button>
              <button
                onClick={handleSave}
                className="flex-[2] flex items-center justify-center gap-2 bg-indigo-600 text-white py-3.5 rounded-2xl font-medium"
              >
                <Camera size={18} />
                保存する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
