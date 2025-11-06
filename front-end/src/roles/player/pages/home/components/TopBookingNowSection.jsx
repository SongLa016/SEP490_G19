import { Button } from "../../../../../shared/components/ui";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FieldCard } from "./FieldCard";
import { ScrollReveal } from "../../../../../shared/components/ScrollReveal";

export const TopBookingNowSection = ({ featuredFields, hoveredCardId, setHoveredCardId }) => {
     const navigate = useNavigate();

     return (
          <ScrollReveal direction="up" delay={0.1}>
               <div className="relative ">
                    <div
                         className="absolute inset-0 bg-cover bg-center"
                         style={{ backgroundImage: "url('https://c1.staticflickr.com/4/3764/33659811165_3a90d35fdb_b.jpg')" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-white" />
                    <div className="relative z-10 py-10">
                         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                              <div className="text-center mb-10">
                                   <h2 className="text-3xl md:text-4xl font-extrabold tracking-wide text-white uppercase">Top book now</h2>
                              </div>

                              <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 relative transition-colors`}>
                                   {/* Dim overlay like modal when a card is hovered */}
                                   {hoveredCardId !== null && (
                                        <div className="pointer-events-none absolute inset-0 rounded-xl backdrop-blur-[1px] transition-opacity" />
                                   )}
                                   {featuredFields.map((field, index) => (
                                        <FieldCard key={field.id} field={field} index={index} hoveredCardId={hoveredCardId} setHoveredCardId={setHoveredCardId} />
                                   ))}
                              </div>

                              <div className="text-center mt-10">
                                   <Button
                                        onClick={() => navigate("/search")}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border hover:border-teal-500 bg-teal-500 border-gray-300 hover:text-white hover:bg-teal-600 transition-colors hover:cursor-pointer"
                                   >
                                        See all
                                        <ArrowRight className="w-4 h-4" />
                                   </Button>
                              </div>
                         </div>
                    </div>
               </div>
          </ScrollReveal>
     );
};

