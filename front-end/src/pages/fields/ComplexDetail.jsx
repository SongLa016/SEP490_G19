import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Section, Container, Card, CardContent, Button } from "../../components/ui";
import { MapPin, Star } from "lucide-react";
import { fetchComplexDetail, fetchTimeSlots } from "../../services/fields";

export default function ComplexDetail({ user }) {
     const { id } = useParams();
     const navigate = useNavigate();
     const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
     const [slotId, setSlotId] = useState("");
     const [timeSlots, setTimeSlots] = useState([]);
     const [complex, setComplex] = useState(null);
     const [fields, setFields] = useState([]);
     const [isLoading, setIsLoading] = useState(false);

     useEffect(() => {
          fetchTimeSlots().then(setTimeSlots);
     }, []);

     useEffect(() => {
          let ignore = false;
          async function load() {
               setIsLoading(true);
               try {
                    const data = await fetchComplexDetail(Number(id), { date, slotId });
                    if (!ignore) {
                         setComplex(data.complex);
                         setFields(data.fields || []);
                    }
               } finally {
                    if (!ignore) setIsLoading(false);
               }
          }
          load();
          return () => { ignore = true; };
     }, [id, date, slotId]);

     const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

     return (
          <Section className="min-h-screen bg-gray-50">
               <Container className="py-8">
                    {complex && (
                         <Card className="mb-6"><CardContent>
                              <div className="flex flex-col md:flex-row gap-6">
                                   <img src={complex.image} alt={complex.name} className="w-full md:w-80 h-48 object-cover rounded-xl" />
                                   <div className="flex-1">
                                        <h1 className="text-2xl font-bold text-teal-800 mb-1">{complex.name}</h1>
                                        <div className="flex items-center text-teal-700 mb-2">
                                             <MapPin className="w-4 h-4 mr-1" />
                                             <span className="text-sm">{complex.address}</span>
                                        </div>
                                        <div className="flex items-center">
                                             <Star className="w-4 h-4 text-teal-400 mr-1" />
                                             <span className="font-semibold">{complex.rating}</span>
                                        </div>
                                        <p className="text-gray-700 mt-3">{complex.description}</p>
                                   </div>
                              </div>
                         </CardContent></Card>
                    )}

                    <Card className="mb-6"><CardContent>
                         <div className="flex flex-col md:flex-row gap-3 items-center">
                              <div className="w-full md:w-56">
                                   <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-10 border rounded-xl border-teal-300 bg-white/80 px-3" />
                              </div>
                              <div className="w-full md:w-64">
                                   <select value={slotId} onChange={(e) => setSlotId(e.target.value)} className="w-full h-10 border rounded-xl border-teal-300 bg-white/80 px-3">
                                        <option value="">Tất cả slot</option>
                                        {timeSlots.map((s) => (
                                             <option key={s.slotId} value={s.slotId}>{s.name}</option>
                                        ))}
                                   </select>
                              </div>
                              <div className="ml-auto text-sm text-teal-700">{isLoading ? "Đang tải..." : `${fields.length} sân nhỏ`}</div>
                         </div>
                    </CardContent></Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {fields.map((f) => (
                              <div key={f.fieldId} className="group bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-xl hover:ring-1 hover:ring-teal-100 h-full flex flex-col cursor-pointer" onClick={() => navigate(`/field/${f.fieldId}`)}>
                                   <img src={f.image} alt={f.name} className="w-full h-40 object-cover" />
                                   <div className="p-4 flex-1 flex flex-col">
                                        <div className="flex items-center justify-between mb-1">
                                             <h3 className="text-lg font-semibold text-teal-800">{f.name}</h3>
                                             <span className={`text-xs px-2 py-1 rounded-full ${f.isAvailableForSelectedSlot ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                                  {slotId ? (f.isAvailableForSelectedSlot ? "Còn chỗ" : "Hết chỗ") : f.typeName}
                                             </span>
                                        </div>
                                        <div className="flex items-center text-teal-700 mb-2">
                                             <MapPin className="w-4 h-4 mr-1" />
                                             <span className="text-sm">{f.address}</span>
                                        </div>
                                        <div className="mt-auto flex items-center justify-between">
                                             <div className="text-teal-600 font-bold">{formatPrice(f.priceForSelectedSlot || 0)}</div>
                                             <Button onClick={(e) => { e.stopPropagation(); navigate(`/field/${f.fieldId}`); }} className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl">Xem chi tiết</Button>
                                        </div>
                                   </div>
                              </div>
                         ))}
                    </div>
               </Container>
          </Section>
     );
}


