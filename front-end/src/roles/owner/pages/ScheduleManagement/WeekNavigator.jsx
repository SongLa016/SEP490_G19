import React from "react";
import { Card, Button } from "../../../../shared/components/ui";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

export default function WeekNavigator({ currentWeek, weekDates, onPrevious, onNext, onToday }) {
     return (
          <Card className="p-4">
               <div className="flex items-center justify-between">
                    <Button onClick={onPrevious} variant="outline" size="sm">
                         <ChevronLeft className="w-4 h-4 mr-1" />
                         Tuần trước
                    </Button>

                    <div className="flex items-center gap-4">
                         <Calendar className="w-5 h-5 text-teal-600" />
                         <span className="font-semibold text-gray-900">
                              Tuần {Math.ceil((weekDates[0].getDate()) / 7)} - Tháng {weekDates[0].getMonth() + 1}, {weekDates[0].getFullYear()}
                         </span>
                         <Button onClick={onToday} variant="outline" size="sm">
                              Hôm nay
                         </Button>
                    </div>

                    <Button onClick={onNext} variant="outline" size="sm">
                         Tuần sau
                         <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
               </div>
          </Card>
     );
}
