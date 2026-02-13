"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface MemberDues {
  id: string;
  name: string;
  totalContributed: number;
}

const DUEL_TARGET = 160; // The goal for each member

export default function DuesPage() {
  const [membersDues, setMembersDues] = useState<MemberDues[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDuesData() {
      try {
        const response = await fetch('/api/dues');
        if (!response.ok) {
          throw new Error('Failed to fetch dues data');
        }
        const data: MemberDues[] = await response.json();
        setMembersDues(data);
      } catch (error) {
        console.error('An error occurred:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDuesData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return <div>Cargando datos de cuotas...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Seguimiento de Cuotas</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {membersDues.length > 0 ? (
          membersDues.map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <CardTitle>{member.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Aportado: {formatCurrency(member.totalContributed)}</span>
                  <span>Meta: {formatCurrency(DUEL_TARGET)}</span>
                </div>
                <ProgressBar value={member.totalContributed} max={DUEL_TARGET} />
                <p className="text-sm text-center">
                  {member.totalContributed >= DUEL_TARGET ? (
                    <span className="text-green-600">¡Meta alcanzada!</span>
                  ) : (
                    <span className="text-orange-500">Faltan {formatCurrency(DUEL_TARGET - member.totalContributed)}</span>
                  )}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <p>No se encontraron jóvenes con cuotas para mostrar.</p>
        )}
      </div>
    </div>
  );
}
