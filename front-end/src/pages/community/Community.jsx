import { Section, Container, Card, CardContent } from "../../components/ui";

export default function Community() {
     const posts = [
          { id: 1, title: "Giải phủi cuối tuần", excerpt: "Tổng hợp giải đấu phủi tại TP.HCM tuần này.", author: "BallSpot", date: "2025-09-10" },
          { id: 2, title: "Mẹo đá sân 7", excerpt: "Chiến thuật phổ biến khi đá sân 7 người.", author: "Coach A", date: "2025-09-08" },
          { id: 3, title: "Chọn giày đá bóng phù hợp", excerpt: "Gợi ý chọn giày theo mặt sân.", author: "BallSpot Blog", date: "2025-09-05" },
          { id: 4, title: "Khởi động đúng cách", excerpt: "Giảm chấn thương khi thi đấu.", author: "Physio Team", date: "2025-09-03" },
     ];

     return (
          <Section className="min-h-screen bg-gray-50">
               <Container className="py-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">Cộng đồng & Bài viết</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {posts.map(p => (
                              <Card key={p.id}><CardContent>
                                   <h2 className="text-xl font-semibold text-gray-900">{p.title}</h2>
                                   <p className="text-gray-600 mt-2">{p.excerpt}</p>
                                   <div className="text-sm text-gray-500 mt-3">{p.author} • {p.date}</div>
                              </CardContent></Card>
                         ))}
                    </div>
               </Container>
          </Section>
     );
}

