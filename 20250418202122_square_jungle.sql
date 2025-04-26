/*
  # Add Enhanced Notification Templates

  1. Changes
    - Add more detailed notification templates
    - Add template variables
    - Add template categories
    
  2. Security
    - Keep existing RLS policies
*/

-- Add template category
ALTER TABLE notification_templates
ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';

-- Update existing templates with more details
UPDATE notification_templates
SET body = '
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px; }
    .content { padding: 20px; background: #f9fafb; border-radius: 8px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; }
    .button { display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Yeni Mesajınız Var</h2>
    </div>
    <div class="content">
      <p>Sayın {{full_name}},</p>
      <p><strong>{{sender_name}}</strong> size yeni bir mesaj gönderdi:</p>
      <blockquote style="margin: 20px 0; padding: 10px; border-left: 4px solid #3b82f6;">
        {{message_content}}
      </blockquote>
      <p>İlan: {{listing_title}}</p>
      <p style="text-align: center;">
        <a href="{{message_url}}" class="button">Mesajı Görüntüle</a>
      </p>
    </div>
    <div class="footer">
      <p>Bu e-posta CarMarket tarafından gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>'
WHERE name = 'new_message';

UPDATE notification_templates
SET body = '
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px; }
    .content { padding: 20px; background: #f9fafb; border-radius: 8px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; }
    .button { display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px; }
    .status { display: inline-block; padding: 4px 8px; border-radius: 4px; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-approved { background: #dcfce7; color: #166534; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>İlan Durumu Güncellendi</h2>
    </div>
    <div class="content">
      <p>Sayın {{full_name}},</p>
      <p><strong>{{listing_title}}</strong> ilanınızın durumu güncellendi:</p>
      <p>
        <span class="status status-{{status}}">{{status_text}}</span>
      </p>
      <p>Güncelleme: {{update_details}}</p>
      <p style="text-align: center;">
        <a href="{{listing_url}}" class="button">İlanı Görüntüle</a>
      </p>
    </div>
    <div class="footer">
      <p>Bu e-posta CarMarket tarafından gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>'
WHERE name = 'listing_update';

UPDATE notification_templates
SET body = '
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px; }
    .content { padding: 20px; background: #f9fafb; border-radius: 8px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; }
    .button { display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px; }
    .warning { color: #991b1b; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Deneme Süreniz Bitiyor</h2>
    </div>
    <div class="content">
      <p>Sayın {{full_name}},</p>
      <p>Kurumsal hesap deneme sürenizin bitmesine <span class="warning">{{days_left}} gün</span> kaldı.</p>
      <p>Deneme süresi sonunda:</p>
      <ul>
        <li>Otomatik sosyal medya paylaşımları</li>
        <li>Toplu ilan yönetimi</li>
        <li>Detaylı analitik raporları</li>
        <li>Öncelikli destek</li>
      </ul>
      <p>gibi kurumsal özelliklere erişiminiz sona erecektir.</p>
      <p style="text-align: center;">
        <a href="{{subscription_url}}" class="button">Üyeliği Uzat</a>
      </p>
    </div>
    <div class="footer">
      <p>Bu e-posta CarMarket tarafından gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>'
WHERE name = 'trial_expiry';

-- Add new templates
INSERT INTO notification_templates (name, category, subject, body) VALUES
  ('listing_approved', 'listing', 'İlanınız Onaylandı', '...'),
  ('listing_rejected', 'listing', 'İlanınız Reddedildi', '...'),
  ('subscription_expiry', 'billing', 'Üyeliğiniz Sona Eriyor', '...'),
  ('welcome_corporate', 'onboarding', 'Kurumsal Hesabınız Aktif', '...')
ON CONFLICT (name) DO NOTHING;