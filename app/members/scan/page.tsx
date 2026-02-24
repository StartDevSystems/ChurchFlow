"use client";

import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, CheckCircle2, User, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

export default function AttendanceScannerPage() {
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [member, setMember] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader", 
      { fps: 10, qrbox: { width: 250, height: 250 } }, 
      false
    );

    scanner.render(onScanSuccess, onScanError);

    async function onScanSuccess(decodedText: string) {
      if (processing) return;
      
      setProcessing(true);
      scanner.pause();
      
      try {
        const res = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberId: decodedText })
        });

        if (res.ok) {
          const data = await res.json();
          setMember(data.member);
          setScannedResult(decodedText);
          toast({ title: "Asistencia Registrada ✓", description: `Bienvenido, ${data.member.name}` });
        } else {
          toast({ title: "Error", description: "No se pudo registrar la asistencia", variant: "destructive" });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setTimeout(() => {
          setProcessing(false);
          setScannedResult(null);
          setMember(null);
          scanner.resume();
        }, 3000);
      }
    }

    function onScanError(err: any) {
      // Ignorar errores de escaneo continuo
    }

    return () => {
      scanner.clear().catch(e => console.error("Error al limpiar scanner", e));
    };
  }, [processing, toast]);

  return (
    <div className="max-w-2xl mx-auto pb-20 px-4">
      <Link href="/members" className="inline-flex items-center gap-2 text-xs font-black uppercase text-gray-500 mb-8 hover:text-[var(--brand-primary)]">
        <ArrowLeft size={14} /> Volver a Miembros
      </Link>

      <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-8 text-white">
        Escaner de <span className="text-blue-500">Asistencia</span>
      </h1>

      <div className="space-y-6">
        <Card className="rounded-[3rem] border-2 border-[#1a1714] overflow-hidden bg-black shadow-2xl">
          <div id="reader" className="w-full"></div>
        </Card>

        {processing && (
          <Card className="rounded-[2.5rem] bg-blue-600 text-white border-none p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-6">
              {member ? (
                <>
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Miembro Identificado</p>
                    <h3 className="text-2xl font-black uppercase italic leading-none">{member.name}</h3>
                    <p className="text-xs font-bold uppercase mt-1">¡Asistencia registrada con éxito!</p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <Loader2 className="animate-spin h-8 w-8" />
                  <p className="font-black uppercase italic">Procesando código...</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
