namespace BallSport.API.Controllers.DistanceCalculator
{
    public class HaversineDistanceCalculator : IDistanceCalculator
    {
        public double Calculate(double lat1, double lng1, double lat2, double lng2)
        {
            const double R = 6371;

            var dLat = ToRadians(lat2 - lat1);
            var dLng = ToRadians(lng2 - lng1);

            lat1 = ToRadians(lat1);
            lat2 = ToRadians(lat2);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(lat1) * Math.Cos(lat2) *
                    Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }

        private static double ToRadians(double deg)
        {
            return deg * Math.PI / 180;
        }
    }

}
