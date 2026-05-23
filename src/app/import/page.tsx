'use client';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { performOCR } from '@/lib/ocr';
import { saveCard, BusinessCard } from '@/lib/storage';
import { ArrowLeft, Upload, CheckCircle2, Image as ImageIcon } from 'lucide-react';

interface ProcessingItem {
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  imageData?: string;
  data?: { companyName: string; fullName: string; phoneNumber: string; email: string; address: string };
}

export default function ImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ProcessingItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [allDone, setAllDone] = useState(false);

  function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const processFiles = useCallback(async (files: FileList) => {
    const newItems: ProcessingItem[] = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .map(file => ({ file, status: 'pending' as const }));

    setItems(newItems);
    setAllDone(false);

    for (let i = 0; i < newItems.length; i++) {
      setItems(prev => prev.map((item, idx) =>
        idx === i ? { ...item, status: 'processing' } : item
      ));

      try {
        const imageData = await readFileAsDataURL(newItems[i].file);
        const data = await performOCR(imageData);

        const card: BusinessCard = {
          id: crypto.randomUUID(),
          imageData,
          companyName: data.companyName,
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          email: data.email,
          address: data.address,
          rawText: data.rawText,
          createdAt: Date.now() - (newItems.length - i) * 1000,
          source: 'import',
        };
        await saveCard(card);

        setItems(prev => prev.map((item, idx) =>
          idx === i ? { ...item, status: 'done', imageData, data } : item
        ));
      } catch {
        setItems(prev => prev.map((item, idx) =>
          idx === i ? { ...item, status: 'error' } : item
        ));
      }
    }

    setAllDone(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col">
      {/* Header */}
      <div className="bg-[#1a1a2e] px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}>
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h1 className="text-white text-xl font-bold">写真をインポート</h1>
        </div>
        <p className="text-gray-400 text-sm mt-2 ml-9">CamCardや既存の名刺写真を取り込みます</p>
      </div>

      <div className="flex-1 px-4 py-6 overflow-y-auto pb-24">
        {items.length === 0 ? (
          <>
            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
              }}
              className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${
                isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-600 hover:border-indigo-500/50'
              }`}
            >
              <div className="w-20 h-20 bg-indigo-600/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Upload size={40} className="text-indigo-400" />
              </div>
              <p className="text-white text-lg font-medium mb-2">写真を選択</p>
              <p className="text-gray-400 text-sm">タップして写真を選択するか<br />ここにドラッグ&ドロップ</p>
              <p className="text-gray-600 text-xs mt-3">複数の画像を一括でインポートできます</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => e.target.files && processFiles(e.target.files)}
            />

            {/* Tips */}
            <div className="mt-6 bg-[#1a1a2e] rounded-2xl p-4">
              <h3 className="text-white font-medium mb-3">インポートのヒント</h3>
              <div className="space-y-2">
                {[
                  'CamCardのエクスポート画像に対応',
                  '複数枚を一括処理できます',
                  '明るく鮮明な写真ほど精度が上がります',
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-indigo-400 text-sm mt-0.5">✓</span>
                    <p className="text-gray-400 text-sm">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Processing list */}
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="bg-[#1a1a2e] rounded-2xl p-4 flex gap-3 items-center">
                  {/* Thumbnail */}
                  <div className="w-16 h-12 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
                    {item.imageData ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageData} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={20} className="text-gray-600" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.file.name}</p>
                    {item.data?.companyName && (
                      <p className="text-indigo-400 text-xs truncate">{item.data.companyName}</p>
                    )}
                    {item.data?.fullName && (
                      <p className="text-gray-300 text-xs truncate">{item.data.fullName}</p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {item.status === 'pending' && <div className="w-5 h-5 rounded-full bg-gray-700" />}
                    {item.status === 'processing' && (
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    {item.status === 'done' && <CheckCircle2 size={20} className="text-green-400" />}
                    {item.status === 'error' && <span className="text-red-400 text-lg">⚠️</span>}
                  </div>
                </div>
              ))}
            </div>

            {allDone && (
              <button
                onClick={() => router.push('/')}
                className="w-full mt-6 bg-indigo-600 text-white py-4 rounded-2xl font-medium text-lg"
              >
                完了 - ホームに戻る
              </button>
            )}
          </>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a2e] border-t border-gray-800 px-4 pb-6 pt-3">
        <div className="flex justify-around">
          <button onClick={() => router.push('/')} className="flex flex-col items-center gap-1">
            <span className="text-gray-400 text-2xl">🏠</span>
            <span className="text-gray-400 text-xs">ホーム</span>
          </button>
          <button onClick={() => router.push('/scan')} className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 bg-indigo-600/30 rounded-full flex items-center justify-center -mt-6">
              <span className="text-white text-2xl">📷</span>
            </div>
            <span className="text-gray-400 text-xs">スキャン</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <Upload size={24} className="text-indigo-500" />
            <span className="text-indigo-500 text-xs font-medium">インポート</span>
          </button>
        </div>
      </div>
    </div>
  );
}
