using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Infrastructure.Settings
{
    public class ReportSettings
    {
        public int AutoHideThreshold { get; set; }
        public bool NotifyAdminOnReport { get; set; }
        public bool EnableReportOnPost { get; set; }
        public bool EnableReportOnComment { get; set; }
    }
}
