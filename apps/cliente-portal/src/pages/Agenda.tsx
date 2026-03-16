import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui";
import { Badge } from "@workspace/shared-ui";
import { Button } from "@workspace/shared-ui";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
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

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: slots = [], isLoading } = useQuery<Slot[]>({
    queryKey: ["agenda"],
    queryFn: async () => {
      const res = await fetch(`${apiBase()}/api/agenda`);
      if (!res.ok) throw new Error("Erro ao carregar agenda");
      return res.json();
    },
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

  const weekDays = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            Agenda de Serviços
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Visualize os horários disponíveis para agendamento
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
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
                  Nenhum horário disponível nesta data.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedSlots.map(slot => (
                  <div 
                    key={slot.id} 
                    className={`rounded-lg border p-3 space-y-1.5 ${
                      slot.isBooked ? "border-muted bg-muted/30" : "border-border/60"
                    }`}
                  >
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
                      </div>
                    </div>
                    {slot.providerCompanyName && (
                      <p className="text-xs text-muted-foreground">
                        Prestador: <span className="font-medium text-foreground">{slot.providerCompanyName}</span>
                      </p>
                    )}
                    {slot.notes && (
                      <p className="text-xs text-muted-foreground">{slot.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
