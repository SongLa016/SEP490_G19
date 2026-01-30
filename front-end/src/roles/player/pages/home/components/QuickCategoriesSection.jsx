import { Container, Section, Button } from "../../../../../shared/components/ui";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollReveal } from "../../../../../shared/components/ScrollReveal";

export const QuickCategoriesSection = ({ featuredFields = [] }) => {
     const navigate = useNavigate();

     // Ensure featuredFields is always an array
     const safeFields = Array.isArray(featuredFields) ? featuredFields : [];

     return (
          <ScrollReveal direction="up" delay={0.1}>
               <Section className="py-5">
                    <Container className="relative py-10 rounded-2xl p-6 overflow-hidden bg-cover bg-center bg-no-repeat" style={{
                         backgroundImage: "url('https://images.pexels.com/photos/47354/the-ball-stadion-football-the-pitch-47354.jpeg')"
                    }}>
                         <div className="absolute inset-0 bg-black/40" />
                         <div className="relative z-10">
                              <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-wide text-white">Danh mục nhanh</h2>
                              <div className="mt-4 h-[2px] w-[40%] bg-white/40" />
                         </div>
                         <div className="relative z-10 flex items-center py-3 gap-6">
                              <div className="relative mb-6 w-1/3">
                                   <p className="mt-4 text-white/90 max-w-xl text-sm md:text-base">
                                        Bạn có thể tìm kiếm nhanh chóng loại sân phù hợp với bạn tại đây.
                                   </p>
                                   <Button onClick={() => navigate("/search")} className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full hover:border-teal-500 hover:border hover:text-teal-500 hover:bg-transparent bg-white text-black transition-colors hover:cursor-pointer">
                                        Xem tất cả
                                        <ArrowRight className="w-4 h-4" />
                                   </Button>
                              </div>
                              <div className="relative -mx-1 overflow-x-auto  scrollbar-none w-2/3">
                                   <div className="px-1 grid grid-cols-3 gap-5 max-w-3xl">
                                        {[
                                             { id: "san5", label: "Sân 5 người", image: safeFields[0]?.imageUrl || safeFields[0]?.image, preset: { typeTab: "5vs5" } },
                                             { id: "san7", label: "Sân 7 người", image: safeFields[1]?.imageUrl || safeFields[1]?.image, preset: { typeTab: "7vs7" } },
                                             { id: "san11", label: "Sân 11 người", image: safeFields[2]?.imageUrl || safeFields[2]?.image, preset: { typeTab: "11vs11" } },
                                        ].map((c) => (
                                             <Button
                                                  key={c.id}
                                                  onClick={() => {
                                                       // Navigate to /search with query param instead of using localStorage
                                                       const params = new URLSearchParams();
                                                       if (c.preset?.typeTab) params.set("typeTab", c.preset.typeTab);
                                                       navigate(`/search?${params.toString()}`);
                                                  }}
                                                  aria-label={c.label}
                                                  className="group text-left flex flex-col items-center justify-center w-full hover:scale-105 transition-all duration-300 hover:cursor-pointer m-1 p-0 h-auto bg-transparent border-0 hover:bg-transparent"
                                             >
                                                  <div className="relative rounded-xl overflow-hidden ring-1 ring-white/25 shadow-md">
                                                       <img
                                                            src={c.image || "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg"}
                                                            alt={c.label}
                                                            className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                       />
                                                  </div>
                                                  <div className="mt-2 text-white font-semibold drop-shadow">{c.label}</div>
                                             </Button>
                                        ))}
                                   </div>
                              </div>
                         </div>
                    </Container>
               </Section>
          </ScrollReveal>
     );
};

