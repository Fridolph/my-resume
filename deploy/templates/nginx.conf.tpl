map $http_upgrade $connection_upgrade {
  default upgrade;
  '' close;
}

server {
  listen 80;
  server_name __RESUME_DOMAIN__ __ADMIN_DOMAIN__ __API_DOMAIN__;

  location /.well-known/acme-challenge/ {
    root __CERTBOT_WEBROOT__;
  }

  location / {
    return 301 https://$host$request_uri;
  }
}

server {
  listen 443 ssl http2;
  server_name __RESUME_DOMAIN__;

  ssl_certificate /etc/letsencrypt/live/__CERTBOT_CERT_NAME__/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/__CERTBOT_CERT_NAME__/privkey.pem;
  include /etc/letsencrypt/options-ssl-nginx.conf;
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

  location /.well-known/acme-challenge/ {
    root __CERTBOT_WEBROOT__;
  }

  location / {
    proxy_pass http://127.0.0.1:5555;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
  }
}

server {
  listen 443 ssl http2;
  server_name __ADMIN_DOMAIN__;

  ssl_certificate /etc/letsencrypt/live/__CERTBOT_CERT_NAME__/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/__CERTBOT_CERT_NAME__/privkey.pem;
  include /etc/letsencrypt/options-ssl-nginx.conf;
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

  location /.well-known/acme-challenge/ {
    root __CERTBOT_WEBROOT__;
  }

  location / {
    proxy_pass http://127.0.0.1:5566;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
  }
}

server {
  listen 443 ssl http2;
  server_name __API_DOMAIN__;
  client_max_body_size 25m;

  ssl_certificate /etc/letsencrypt/live/__CERTBOT_CERT_NAME__/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/__CERTBOT_CERT_NAME__/privkey.pem;
  include /etc/letsencrypt/options-ssl-nginx.conf;
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

  location /.well-known/acme-challenge/ {
    root __CERTBOT_WEBROOT__;
  }

  location / {
    proxy_pass http://127.0.0.1:5577;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
  }
}
