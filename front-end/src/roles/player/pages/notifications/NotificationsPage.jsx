import React from "react";
import { Section, Container } from "../../../../shared/components/ui";
import { NotificationsDisplay } from "../../../../shared";

export default function NotificationsPage({ user }) {
     const userId = user?.userID || user?.UserID || user?.id || user?.Id || user?.userId;

     return (
          <Section className="min-h-screen bg-[url('https://mixivivu.com/section-background.png')] bg-cover bg-center">
               <Container className="py-10 mt-12 md:py-16 max-w-5xl">
                    <div className="mb-5 text-center md:text-left">
                         <h1 className="text-3xl md:text-4xl font-extrabold text-teal-900 tracking-tight">
                              Thông báo của bạn
                         </h1>
                         <p className="mt-2 text-sm md:text-base text-slate-600">
                              Xem toàn bộ thông báo hệ thống, cộng đồng và các cập nhật liên quan đến tài khoản của bạn.
                         </p>
                    </div>

                    <NotificationsDisplay userId={userId} className="shadow-xl rounded-2xl border border-teal-100" />
               </Container>
          </Section>
     );
}


