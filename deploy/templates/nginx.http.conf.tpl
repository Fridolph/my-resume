map $http_upgrade $connection_upgrade {
  default upgrade;
  '' close;
}

server {
  listen 80;
  server_name __RESUME_DOMAIN__;

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
  listen 80;
  server_name __ADMIN_DOMAIN__;

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
  listen 80;
  server_name __API_DOMAIN__;
  client_max_body_size 25m;

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
