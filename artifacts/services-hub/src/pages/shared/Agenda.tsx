import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar, Clock, Plus, Trash2, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { apiBase } from "@/lib/utils";

type Slot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string | null;
  isBooked: boolean;
  providerCompanyId?: string;
  providerCompanyName?: string;
};

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(t: string) {
  return t.substring(0, 5);
}

function addMonths(date: Date, n: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function Agenda() {
  const { activeProfile } = useAuth();
  const role = activeProfile?.role;
  const queryClient = useQueryClient();

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showNewSlot, setShowNewSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({ date: "", startTime: "08:00", endTime: "09:00", notes: "" });

  const { data: slots = [], isLoading } = useQuery<Slot[]>({
    queryKey: ["agenda"],
    queryFn: async () => {
      const res = await fetch(`${apiBase()}/api/agenda`);
      if (!res.ok) throw new Error("Erro ao carregar agenda");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: typeof newSlot) => {
      const res = await fetch(`${apiBase()}/api/agenda`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erro ao criar disponibilidade");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda"] });
      setShowNewSlot(false);
      setNewSlot({ date: "", startTime: "08:00", endTime: "09:00", notes: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${apiBase()}/api/agenda/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir slot");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agenda"] }),
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const { firstDay, daysInMonth } = getMonthDays(year, month);
  const today = new Date().toISOString().split("T")[0];

  const slotsByDate = slots.reduce<Record<string, Slot[]>>((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  const selectedSlots = selectedDate ? (slotsByDate[selectedDate] || []) : [];

  const monthNames = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];

  function openNewSlot(date?: string) {
    setNewSlot({
      date: date || today,
      startTime: "08:00",
      endTime: "09:00",
      notes: "",
    });
    setShowNewSlot(true);
  }

  const weekDays = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

  // Group slots by provider for admin view
  const providerGroups = role === "admin"
    ? Object.entries(
        slots.reduce<Record<string, { name: string; count: number; dates: string[] }>>((acc, s) => {
          const key = s.providerCompanyId || "?";
          if (!acc[key]) acc[key] = { name: s.providerCompanyName || key, count: 0, dates: [] };
          acc[key].count++;
          if (!acc[key].dates.includes(s.date)) acc[key].dates.push(s.date);
          return acc;
        }, {})
      )
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {role === "admin" ? "Agenda Compartilhada" : role === "provider" ? "Minhas Disponibilidades" : "Agenda de Atendimento"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {role === "admin"
              ? "Veja todos os prestadores e suas disponibilidades"
              : role === "provider"
              ? "Gerencie seus horários disponíveis para atendimento"
              : "Veja os horários disponíveis para agendamento"}
          </p>
        </div>
        {role === "provider" && (
          <Button onClick={() => openNewSlot()} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Disponibilidade
          </Button>
        )}
      </div>

      {/* Admin provider summary */}
      {role === "admin" && providerGroups.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providerGroups.map(([id, info]) => (
            <Card key={id} className="border-border/60">
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{info.name}</p>
                  <p className="text-xs text-muted-foreground">{info.count} slot(s) · {info.dates.length} dia(s)</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                {monthNames[month]} {year}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => addMonths(m, -1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dateStr = toDateStr(year, month, day);
                const daySlots = slotsByDate[dateStr] || [];
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === today;
                const isPast = dateStr < today;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    disabled={isPast}
                    className={`
                      relative aspect-square rounded-lg text-sm font-medium transition-all flex flex-col items-center justify-center gap-0.5
                      ${isSelected ? "bg-primary text-primary-foreground shadow-md" : ""}
                      ${isToday && !isSelected ? "ring-2 ring-primary ring-offset-1" : ""}
                      ${isPast ? "opacity-30 cursor-not-allowed" : "hover:bg-muted cursor-pointer"}
                      ${!isSelected && !isPast ? "text-foreground" : ""}
                    `}
                  >
                    {day}
                    {daySlots.length > 0 && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground/70" : "bg-primary"}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Slots for selected day */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              {selectedDate ? formatDate(selectedDate) : "Selecione um dia"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Clique em um dia no calendário para ver os horários disponíveis.
              </p>
            ) : isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
            ) : selectedSlots.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <Calendar className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {role === "provider"
                    ? "Nenhuma disponibilidade cadastrada para este dia."
                    : "Nenhum horário disponível nesta data."}
                </p>
                {role === "provider" && (
                  <Button variant="outline" size="sm" onClick={() => openNewSlot(selectedDate)} className="gap-1">
                    <Plus className="w-3 h-3" />
                    Adicionar horário
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {selectedSlots.map(slot => (
                  <div key={slot.id} className={`rounded-lg border p-3 space-y-1.5 ${slot.isBooked ? "border-muted bg-muted/30" : "border-border/60"}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">
                        {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                      </span>
                      <div className="flex items-center gap-2">
                        {slot.isBooked ? (
                          <Badge variant="secondary" className="text-xs">Reservado</Badge>
                        ) : (
                          <Badge className="text-xs bg-green-100 text-green-700 border-green-200">Disponível</Badge>
                        )}
                        {(role === "provider" || role === "admin") && !slot.isBooked && (
                          <button
                            onClick={() => deleteMutation.mutate(slot.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {slot.providerCompanyName && role === "admin" && (
                      <p className="text-xs text-muted-foreground">Prestador: <span className="font-medium text-foreground">{slot.providerCompanyName}</span></p>
                    )}
                    {slot.notes && (
                      <p className="text-xs text-muted-foreground">{slot.notes}</p>
                    )}
                  </div>
                ))}
                {role === "provider" && selectedDate && (
                  <Button variant="outline" size="sm" className="w-full gap-1 mt-1" onClick={() => openNewSlot(selectedDate)}>
                    <Plus className="w-3 h-3" />
                    Adicionar horário
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New slot dialog */}
      <Dialog open={showNewSlot} onOpenChange={setShowNewSlot}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Disponibilidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input
                type="date"
                min={today}
                value={newSlot.date}
                onChange={e => setNewSlot(s => ({ ...s, date: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Início</Label>
                <Input
                  type="time"
                  value={newSlot.startTime}
                  onChange={e => setNewSlot(s => ({ ...s, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fim</Label>
                <Input
                  type="time"
                  value={newSlot.endTime}
                  onChange={e => setNewSlot(s => ({ ...s, endTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observações (opcional)</Label>
              <Textarea
                placeholder="Ex: disponível para manutenção de ar-condicionado"
                value={newSlot.notes}
                onChange={e => setNewSlot(s => ({ ...s, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSlot(false)}>Cancelar</Button>
            <Button
              onClick={() => createMutation.mutate(newSlot)}
              disabled={!newSlot.date || !newSlot.startTime || !newSlot.endTime || createMutation.isPending}
            >
              {createMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
