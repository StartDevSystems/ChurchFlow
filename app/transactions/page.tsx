"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/AlertDialog";
import { PlusCircle, Edit, Trash2, ArrowUpRight, ArrowDownRight, Search, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ... (tipos e interfaces se mantienen igual)

export default function TransactionsPage() {
  // ... (estados existentes)

  const exportToExcel = () => {
    const dataToExport = filtered.map(t => ({
      Fecha: format(new Date(t.date), 'dd/MM/yyyy'),
      Descripción: t.description,
      Categoría: t.category.name,
      Tipo: t.type === 'income' ? 'Ingreso' : 'Gasto',
      Monto: t.amount,
      Miembro: t.member?.name || 'N/A',
      Evento: t.event?.name || 'Caja General'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transacciones");
    XLSX.writeFile(wb, `Reporte_Finanzas_${format(new Date(), 'dd_MM_yyyy')}.xlsx`);
  };

  const generateReceipt = (t: Transaction) => {
    const doc = new jsPDF() as any;
    
    // Header
    doc.setFillColor(232, 93, 38); // Brand Primary
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("COMPROBANTE FINANCIERO", 105, 25, { align: "center" });
    
    // Body
    doc.setTextColor(26, 23, 20);
    doc.setFontSize(12);
    doc.text(`ID Transacción: ${t.id.substring(0, 8)}`, 20, 50);
    doc.text(`Fecha: ${format(new Date(t.date), 'dd/MM/yyyy')}`, 20, 60);
    
    doc.autoTable({
      startY: 70,
      head: [['Descripción', 'Categoría', 'Tipo', 'Monto']],
      body: [[
        t.description,
        t.category.name,
        t.type === 'income' ? 'Ingreso' : 'Gasto',
        fmt(t.amount)
      ]],
      headStyles: { fillStyle: [232, 93, 38] }
    });
    
    doc.text("Firma Autorizada:", 20, 120);
    doc.line(20, 140, 80, 140);
    
    doc.setFontSize(10);
    doc.setTextColor(140, 127, 114);
    doc.text("Generado por ChurchFlow - Finanzas Jóvenes", 105, 280, { align: "center" });
    
    doc.save(`Recibo_${t.id.substring(0, 8)}.pdf`);
  };

  // ... (resto del componente)

  return (
    <div className="-mx-4 md:-mx-8 -mt-4 md:-mt-8">
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tx-row { animation: slideUp 0.25s ease both; }
        .btn-filter-active {
          background: var(--brand-primary) !important;
          border-color: var(--brand-primary) !important;
          color: #fff !important;
        }
        .btn-nueva-tx {
          background: var(--brand-primary);
          box-shadow: 0 4px 20px color-mix(in srgb, var(--brand-primary) 40%, transparent);
        }
        .btn-nueva-tx:hover {
          filter: brightness(1.1);
        }
        .stat-border-brand {
          border-left: 3px solid var(--brand-primary);
        }
        .edit-btn:hover {
          border-color: var(--brand-primary) !important;
          color: var(--brand-primary) !important;
        }
        .grid-bg {
          background-image: linear-gradient(color-mix(in srgb, var(--brand-primary) 5%, transparent) 1px, transparent 1px),
                            linear-gradient(90deg, color-mix(in srgb, var(--brand-primary) 5%, transparent) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .hero-glow {
          background: radial-gradient(circle, color-mix(in srgb, var(--brand-primary) 12%, transparent) 0%, transparent 70%);
        }
        .empty-icon {
          background: linear-gradient(135deg, var(--brand-primary), color-mix(in srgb, var(--brand-primary) 60%, #f5a623));
        }
        .label-brand {
          color: color-mix(in srgb, var(--brand-primary) 80%, transparent);
        }
      `}</style>

      {/* ── Hero oscuro ── */}
      <div style={{
        background: 'linear-gradient(160deg, #0f1117 0%, #1a1d2e 60%, #0f1117 100%)',
        padding: '40px 40px 56px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0 }} />
        <div className="hero-glow" style={{
          position: 'absolute', top: '-60px', right: '10%',
          width: '300px', height: '300px', borderRadius: '50%',
          pointerEvents: 'none',
        }} />

        <div className="relative z-10">
          <p className="label-brand" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>
            MÓDULO FINANCIERO
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
              Transacciones
            </h1>
            <div className="flex gap-3">
              <button onClick={exportToExcel} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: '13px', fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                <Download size={15} />
                Excel
              </button>
              <Link href="/transactions/new">
                <button className="btn-nueva-tx" style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '12px',
                  color: '#fff', fontSize: '13px', fontWeight: 700,
                  border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                  <PlusCircle size={15} />
                  Nueva Transacción
                </button>
              </Link>
            </div>
          </div>

          {/* Mini stats */}
          <div className="flex gap-6 mt-8 flex-wrap">
            <div style={{ borderLeft: '3px solid #2a8a5e', paddingLeft: '14px' }}>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase' }}>Total Ingresos</p>
              <p style={{ fontSize: '22px', fontWeight: 900, color: '#4ade80', letterSpacing: '-0.03em' }}>{fmt(totalIncome)}</p>
            </div>
            <div style={{ borderLeft: '3px solid #dc3545', paddingLeft: '14px' }}>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase' }}>Total Gastos</p>
              <p style={{ fontSize: '22px', fontWeight: 900, color: '#f87171', letterSpacing: '-0.03em' }}>{fmt(totalExpense)}</p>
            </div>
            <div className="stat-border-brand" style={{ paddingLeft: '14px' }}>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase' }}>Registros</p>
              <p style={{ fontSize: '22px', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>{transactions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="px-4 md:px-8 py-6">

        {/* Barra de filtros — oscura para continuar el hero */}
        <div style={{
          background: '#1a1d2e',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
          padding: '10px 14px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        }}>
          <div className="flex gap-1.5">
            {[
              { key: 'all', label: 'Todas' },
              { key: 'income', label: 'Ingresos' },
              { key: 'expense', label: 'Gastos' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as any)}
                className={filter === f.key ? 'btn-filter-active' : ''}
                style={{
                  padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.45)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >{f.label}</button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2" style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            padding: '7px 12px',
          }}>
            <Search size={13} color="rgba(255,255,255,0.35)" />
            <input
              type="text"
              placeholder="Buscar transacción..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                outline: 'none', background: 'transparent',
                fontSize: '13px', color: '#fff',
                width: '160px',
              }}
              className="placeholder:text-white/30"
            />
          </div>
        </div>

        {/* Tabla */}
        <div style={{ background: '#13151f', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <div className="empty-icon" style={{
                width: '52px', height: '52px', borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
              }}>
                <ArrowUpRight size={22} color="#fff" />
              </div>
              <p className="font-bold text-[#1a1714] dark:text-white text-base mb-1">Sin transacciones</p>
              <p className="text-sm text-[#8c7f72]">
                {search ? 'No hay resultados para tu búsqueda.' : 'Crea la primera transacción para comenzar.'}
              </p>
            </div>
          ) : (
            <>
              {/* Header tabla */}
              <div className="hidden md:grid" style={{
                gridTemplateColumns: '1fr 130px 100px 120px 90px 72px',
                padding: '10px 20px',
                borderBottom: '1px solid rgba(26,29,46,0.08)',
                background: 'rgba(26,29,46,0.03)',
              }}>
                {['Descripción', 'Categoría', 'Tipo', 'Monto', 'Fecha', ''].map((h, i) => (
                  <p key={i} style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>{h}</p>
                ))}
              </div>

              {/* Filas */}
              {filtered.map((t, idx) => (
                <div key={t.id} className="tx-row" style={{ animationDelay: `${idx * 25}ms` }}>
                  {/* Desktop */}
                  <div
                    className="hidden md:grid"
                    style={{
                      gridTemplateColumns: '1fr 130px 100px 120px 90px 72px',
                      padding: '13px 20px',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      alignItems: 'center',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,93,38,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: t.type === 'income' ? 'rgba(42,138,94,0.1)' : 'rgba(220,53,69,0.1)',
                      }}>
                        {t.type === 'income'
                          ? <ArrowUpRight size={14} color="#2a8a5e" />
                          : <ArrowDownRight size={14} color="#dc3545" />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</p>
                        {(t.member || t.event) && (
                          <p style={{ fontSize: '10px', color: '#8c7f72', marginTop: '1px' }}>
                            {t.member && <span>{t.member.name}</span>}
                            {t.member && t.event && ' · '}
                            {t.event && <span style={{ color: '#0e7490' }}>{t.event.name}</span>}
                          </p>
                        )}
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.category.name}</p>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
                      background: t.type === 'income' ? 'rgba(42,138,94,0.1)' : 'rgba(220,53,69,0.1)',
                      color: t.type === 'income' ? '#2a8a5e' : '#dc3545', width: 'fit-content',
                    }}>
                      {t.type === 'income' ? 'Ingreso' : 'Gasto'}
                    </span>
                    <p style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '-0.02em', color: t.type === 'income' ? '#2a8a5e' : '#dc3545' }}>
                      {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                    </p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{format(new Date(t.date), 'd MMM yy', { locale: es })}</p>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button onClick={() => generateReceipt(t)} style={{
                        width: '28px', height: '28px', borderRadius: '7px',
                        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#60a5fa', transition: 'all 0.15s',
                      }} title="Descargar Recibo PDF"><FileText size={11} /></button>
                      <Link href={`/transactions/edit/${t.id}`}>
                        <button className="edit-btn" style={{
                          width: '28px', height: '28px', borderRadius: '7px',
                          border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: 'rgba(255,255,255,0.4)', transition: 'all 0.15s',
                        }}><Edit size={11} /></button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button style={{
                            width: '28px', height: '28px', borderRadius: '7px',
                            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'rgba(255,255,255,0.4)', transition: 'all 0.15s',
                          }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#dc3545'; (e.currentTarget as HTMLButtonElement).style.color = '#dc3545'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)'; }}
                          ><Trash2 size={11} /></button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar transacción?</AlertDialogTitle>
                            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(t.id)} className="bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden flex items-center gap-3 p-4" style={{ borderBottom: '1px solid #f7f4ef' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: t.type === 'income' ? 'rgba(42,138,94,0.1)' : 'rgba(220,53,69,0.1)',
                    }}>
                      {t.type === 'income' ? <ArrowUpRight size={16} color="#2a8a5e" /> : <ArrowDownRight size={16} color="#dc3545" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1a1714] dark:text-white truncate">{t.description}</p>
                      <p className="text-[10px] text-[#8c7f72]">{t.category.name} · {format(new Date(t.date), 'd MMM yy', { locale: es })}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p style={{ fontSize: '13px', fontWeight: 800, color: t.type === 'income' ? '#2a8a5e' : '#dc3545' }}>
                        {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                      </p>
                      <div className="flex gap-1 mt-1 justify-end">
                        <Link href={`/transactions/edit/${t.id}`}>
                          <button className="w-6 h-6 rounded flex items-center justify-center border border-[#e8e2d9] text-[#8c7f72]"><Edit size={10} /></button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="w-6 h-6 rounded flex items-center justify-center border border-[#e8e2d9] text-[#8c7f72]"><Trash2 size={10} /></button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar transacción?</AlertDialogTitle>
                              <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(t.id)} className="bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}