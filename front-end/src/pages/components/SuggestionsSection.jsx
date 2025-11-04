import { useRef, useEffect } from "react";
import { Container, Button } from "../../shared/components/ui";
import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollReveal } from "../../shared/components/ScrollReveal";

export const SuggestionsSection = () => {
     const navigate = useNavigate();
     const suggestRef = useRef(null);

     // Subtle parallax for suggestion section background
     useEffect(() => {
          const handleScroll = () => {
               const scrollY = window.pageYOffset;

               if (suggestRef.current) {
                    const sugBg = suggestRef.current.querySelector('.suggest-parallax-bg');
                    if (sugBg) {
                         sugBg.style.transform = `translateY(${scrollY * 0.2}px)`;
                    }
               }
          };

          window.addEventListener('scroll', handleScroll);
          return () => window.removeEventListener('scroll', handleScroll);
     }, []);

     const suggestionGroups = [
          {
               id: 'time',
               title: 'Theo thời điểm',
               items: [
                    { id: 'morning', title: 'Sân buổi sáng', desc: 'Mát mẻ, giá tốt, dễ có slot.', img: 'https://images.unsplash.com/photo-1521417531039-95f0b7fdd0e5?w=800&h=600&fit=crop', preset: { timeOfDay: 'morning' } },
                    { id: 'afternoon', title: 'Sân buổi chiều', desc: 'Ánh sáng đẹp, năng lượng nhất ngày.', img: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=800&h=600&fit=crop', preset: { timeOfDay: 'afternoon' } },
                    { id: 'evening', title: 'Sân buổi tối', desc: 'Không nắng gắt, hợp sau giờ làm.', img: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=600&fit=crop', preset: { timeOfDay: 'evening' } },
                    { id: 'lowpeak', title: 'Giờ thấp điểm', desc: 'Dễ đặt, có thể rẻ hơn.', img: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=600&fit=crop', preset: { filter: 'offpeak' } },
               ]
          },
          {
               id: 'price',
               title: 'Theo mức giá',
               items: [
                    { id: 'under100', title: 'Giá tiết kiệm', desc: 'Dưới 100k/giờ, hợp team sinh viên.', img: 'https://images.unsplash.com/photo-1599050751795-5fa78f5c9c23?w=800&h=600&fit=crop', preset: { price: 'under100' } },
                    { id: '100-200', title: 'Giá tầm trung', desc: '100k - 200k/giờ, nhiều lựa chọn.', img: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=800&h=600&fit=crop', preset: { price: '100-200' } },
                    { id: '200-300', title: '200k - 300k', desc: 'Chất lượng tốt, sân đẹp.', img: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&h=600&fit=crop', preset: { price: '200-300' } },
                    { id: 'over300', title: 'Giá cao cấp', desc: 'Trên 300k/giờ, dịch vụ tốt.', img: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800&h=600&fit=crop', preset: { price: 'over300' } },
               ]
          },
          {
               id: 'type',
               title: 'Theo loại sân',
               items: [
                    { id: 'type5', title: 'Sân 5 người', desc: 'Đội nhỏ, trận đấu nhanh.', img: 'https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg?w=800&h=600&fit=crop', preset: { searchQuery: 'Sân 5' } },
                    { id: 'type7', title: 'Sân 7 người', desc: 'Cân bằng vận động-chiến thuật.', img: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&h=600&fit=crop', preset: { searchQuery: 'Sân 7' } },
                    { id: 'type11', title: 'Sân 11 người', desc: 'Chuẩn thi đấu, không gian rộng.', img: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&h=600&fit=crop', preset: { searchQuery: 'Sân 11' } },
                    { id: 'indoor', title: 'Sân phủ mái', desc: 'Không lo mưa nắng, ổn định.', img: 'https://images.unsplash.com/photo-1517245302115-5b4f3f0b4769?w=800&h=600&fit=crop', preset: { features: 'indoor' } },
               ]
          }
     ];

     return (
          <ScrollReveal direction="up" delay={0.1}>
               <Container ref={suggestRef} className="relative border border-gray-400 py-10 my-10 rounded-2xl overflow-hidden">
                    <div
                         className="suggest-parallax-bg absolute inset-0 bg-cover bg-center"
                         style={{ backgroundImage: "url('https://i.pinimg.com/originals/a3/c7/79/a3c779e5d5b622eeb598ac1d50c05cb8.png')", willChange: 'transform' }}
                    />
                    <div className="absolute inset-0 bg-white/30" />
                    <Container className="relative z-10">
                         <div className="max-w-3xl mx-auto text-center mb-10">
                              <h2 className="text-3xl md:text-4xl font-extrabold tracking-wide text-teal-800">Gợi ý dành cho bạn</h2>
                              <p className="mt-3 text-gray-600">Những lựa chọn được yêu thích, phù hợp cho nhiều nhóm người chơi và thời điểm khác nhau.</p>
                         </div>

                         {suggestionGroups.map((group) => (
                              <div key={group.id} className="mb-12">
                                   <div className="flex items-end justify-between mb-5">
                                        <h3 className="text-2xl font-bold text-teal-800 drop-shadow-sm">{group.title}</h3>
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {group.items.map((s) => (
                                             <div key={s.id} className="[perspective:1000px]">
                                                  <div className="relative h-56 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all [transform-style:preserve-3d] duration-700 ease-out group/card hover:[transform:rotateY(180deg)]">
                                                       {/* Front */}
                                                       <div className="absolute inset-0 overflow-hidden rounded-2xl [backface-visibility:hidden] will-change-transform">
                                                            <img src={s.img} alt={s.title} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                                                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                                                 <h4 className="text-white font-semibold text-base truncate drop-shadow">{s.title}</h4>
                                                                 <span className="ml-3 inline-flex items-center text-[10px] px-2 py-1 rounded-full bg-white/90 text-teal-700 border border-teal-200">Gợi ý</span>
                                                            </div>
                                                       </div>
                                                       {/* Back */}
                                                       <div className="absolute inset-0 rounded-2xl bg-white p-4 grid content-between [backface-visibility:hidden] [transform:rotateY(180deg)] will-change-transform">
                                                            <div>
                                                                 <div className="flex items-start justify-between">
                                                                      <h4 className="text-teal-700 font-semibold text-base truncate">{s.title}</h4>
                                                                      <span className="text-[10px] px-2 py-1 rounded-full bg-teal-50 text-teal-600 border border-teal-100">Nhóm</span>
                                                                 </div>
                                                                 <div className="mt-2 flex items-center text-xs text-gray-600">
                                                                      <MapPin className="w-3.5 h-3.5 mr-1" />
                                                                      <span className="truncate">Đa khu vực</span>
                                                                 </div>
                                                                 <div className="mt-2 text-xs text-gray-700">{s.desc}</div>
                                                                 <div className="mt-3 flex flex-wrap gap-1.5">
                                                                      {['Sạch đẹp', 'Dễ đặt', 'Phù hợp nhóm'].map((tag, i) => (
                                                                           <span key={i} className="px-2 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100 text-[11px]">{tag}</span>
                                                                      ))}
                                                                 </div>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                 <span className="text-[11px] inline-flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full border">Số lượng: <span className="font-semibold text-teal-700">Nhiều</span></span>
                                                                 <Button
                                                                      onClick={() => { try { window.localStorage.setItem('searchPreset', JSON.stringify(s.preset || {})); } catch { } navigate('/search'); }}
                                                                      className="rounded-full h-8 px-3 text-xs bg-teal-500 hover:bg-teal-600 text-white"
                                                                 >
                                                                      Đặt ngay
                                                                 </Button>
                                                            </div>
                                                       </div>
                                                  </div>
                                             </div>
                                        ))}
                                   </div>
                              </div>
                         ))}
                    </Container>
               </Container>
          </ScrollReveal>
     );
};

