using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Infrastructure.Settings
{
    public class NotificationSettings
    {
        public bool EnableEmailNotification { get; set; }
        public bool EnablePushNotification { get; set; }
        public int SystemUserId { get; set; }
        public bool EnableMentionNotification { get; set; }
        public bool EnableCommentReplyNotification { get; set; }
        public bool EnableLikeNotification { get; set; }
    }
}
