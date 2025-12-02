import { useEffect, useState } from "react";
import { Heart, MapPin, Star, Loader2 } from "lucide-react";
import { Section, Container, Card, CardHeader, CardTitle, CardContent, Button } from "../../../../shared/components/ui";
import { fetchFavoriteFields, fetchFieldDetail } from "../../../../shared/index";
import { useNavigate } from "react-router-dom";

export default function FavoriteFields() {
  const [favoriteFields, setFavoriteFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setLoading(true);
        setError(null);

        const list = await fetchFavoriteFields();
        const ids = (list || [])
          .map((item) => Number(item.fieldId))
          .filter((id) => !Number.isNaN(id));

        if (ids.length === 0) {
          setFavoriteFields([]);
          return;
        }

        const details = await Promise.all(
          ids.map(async (id) => {
            try {
              const field = await fetchFieldDetail(id);
              return field;
            } catch {
              return null;
            }
          })
        );

        setFavoriteFields(details.filter((f) => f));
      } catch (err) {
        console.error("Error loading favorite fields:", err);
        setError(err.message || "Không thể tải danh sách sân yêu thích.");
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, []);

  if (loading) {
    return (
      <Section className="relative min-h-screen">
        <div className="absolute inset-0 bg-[url('https://mixivivu.com/section-background.png')] bg-cover bg-center border border-teal-600 rounded-3xl" />
        <Container>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-4" />
              <p className="text-teal-700 text-base">Đang tải danh sách sân yêu thích...</p>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  if (error) {
    return (
      <Section className="relative min-h-screen">
        <div className="absolute inset-0 bg-[url('https://mixivivu.com/section-background.png')] bg-cover bg-center border border-teal-600 rounded-3xl" />
        <Container>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Card className="max-w-xl mx-auto border-red-200 bg-red-50/90">
              <CardHeader>
                <CardTitle className="text-red-700">Lỗi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600 mb-4">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="border-red-300 text-red-700"
                >
                  Thử lại
                </Button>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section className="relative min-h-screen">
      <div className="absolute inset-0 bg-[url('https://mixivivu.com/section-background.png')] bg-cover bg-center border border-teal-600 rounded-3xl" />
      <Container>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card className="border border-teal-200/80 bg-white/95 shadow-xl backdrop-blur rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-teal-300/70 bg-gradient-to-r from-teal-50 via-white to-white rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 rounded-xl">
                  <Heart className="w-5 h-5 text-pink-600" />
                </div>
                <CardTitle className="text-teal-900 text-xl font-semibold">
                  Sân yêu thích
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {favoriteFields.length === 0 ? (
                <div className="text-center py-10">
                  <Heart className="w-10 h-10 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-700 font-medium mb-2">
                    Bạn chưa có sân nào trong danh sách yêu thích.
                  </p>
                  <p className="text-gray-500 text-sm mb-4">
                    Hãy quay lại trang tìm sân và nhấn vào biểu tượng trái tim để lưu sân bạn yêu thích.
                  </p>
                  <Button
                    className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl"
                    onClick={() => navigate("/fields")}
                  >
                    Tìm sân ngay
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {favoriteFields.map((field) => (
                    <div
                      key={field.fieldId}
                      className="border border-teal-100 rounded-2xl p-4 flex gap-3 hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer bg-white/90"
                      onClick={() => navigate(`/field/${field.fieldId}`)}
                    >
                      <div className="w-28 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                        {field.mainImageUrl ? (
                          <img
                            src={field.mainImageUrl}
                            alt={field.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs px-2 text-center">
                            Không có ảnh
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-teal-900 line-clamp-2">
                            {field.name}
                          </h3>
                          <Heart className="w-4 h-4 text-pink-500 fill-pink-500 flex-shrink-0" />
                        </div>
                        <p className="mt-1 text-xs text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-teal-500" />
                          <span className="line-clamp-1">
                            {field.address || "Chưa có địa chỉ"}
                          </span>
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-yellow-600">
                            <Star className="w-3 h-3" />
                            <span className="font-semibold">
                              {field.rating ? field.rating.toFixed(1) : "0.0"}
                            </span>
                          </div>
                          {field.pricePerHour > 0 && (
                            <p className="text-xs font-semibold text-orange-600">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                                maximumFractionDigits: 0,
                              }).format(field.pricePerHour)}
                              /trận
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Container>
    </Section>
  );
}


