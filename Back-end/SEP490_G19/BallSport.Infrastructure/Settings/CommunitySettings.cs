using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Infrastructure.Settings
{
    public class CommunitySettings
    {
        public int MaxPostLength { get; set; }
        public int MaxCommentLength { get; set; }
        public bool AllowMediaUpload { get; set; }
        public int MaxMediaSizeMB { get; set; }
        public string[] AllowedMediaTypes { get; set; } = Array.Empty<string>();
        public string DefaultPostVisibility { get; set; } = "public";
        public bool AllowGuestView { get; set; }
    }
}
