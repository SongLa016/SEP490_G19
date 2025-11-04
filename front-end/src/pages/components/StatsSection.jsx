import { motion } from "framer-motion";
import { Container, Row } from "../../shared/components/ui";
import { StatsCard } from "./StatsCard";
import { Calendar, Users, TrendingUp, Star } from "lucide-react";
import { ScrollReveal } from "../../shared/components/ScrollReveal";

export const StatsSection = () => {
     return (
          <ScrollReveal direction="up" delay={0.1} once={false}>
               <motion.section
                    className="py-8 bg-gradient-to-br from-gray-100 via-teal-50/30 to-gray-100 relative overflow-hidden"
               >
                    <motion.div
                         className="absolute inset-0 opacity-20"
                         animate={{
                              backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
                         }}
                         transition={{
                              duration: 20,
                              repeat: Infinity,
                              ease: "linear",
                         }}
                         style={{
                              backgroundImage: "linear-gradient(45deg, transparent 30%, rgba(20, 184, 166, 0.3) 50%, transparent 70%)",
                              backgroundSize: "200% 200%",
                         }}
                    />
                    <Container className="relative z-10">
                         <Row className="md:grid-cols-4 text-center">
                              <StatsCard targetValue={500} suffix="+" label="Sân bóng" index={0} Icon={Calendar} />
                              <StatsCard targetValue={10000} suffix="+" label="Người dùng" index={1} Icon={Users} />
                              <StatsCard targetValue={50000} suffix="+" label="Lượt đặt sân" index={2} Icon={TrendingUp} />
                              <StatsCard targetValue={4.8} suffix="" label="Đánh giá trung bình" index={3} decimals={1} Icon={Star} />
                         </Row>
                    </Container>
               </motion.section>
          </ScrollReveal>
     );
};

