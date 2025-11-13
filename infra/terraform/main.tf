terraform {
  required_version = ">= 1.0"
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.44"
    }
  }
}

variable "hcloud_token" {
  description = "Hetzner Cloud API Token"
  type        = string
  sensitive   = true
}

variable "ssh_public_key" {
  description = "SSH public key for server access"
  type        = string
}

variable "domain" {
  description = "Domain name for the application"
  type        = string
  default     = "your-domain.com"
}

provider "hcloud" {
  token = var.hcloud_token
}

resource "hcloud_ssh_key" "default" {
  name       = "rsp-studio-key"
  public_key = var.ssh_public_key
}

resource "hcloud_server" "rsp_studio" {
  name        = "rsp-studio-prod"
  server_type = "cx11"
  image       = "ubuntu-22.04"
  location    = "nbg1"
  ssh_keys    = [hcloud_ssh_key.default.id]

  labels = {
    environment = "production"
    project     = "rsp-studio"
  }

  user_data = <<-EOF
    #!/bin/bash
    apt-get update
    apt-get upgrade -y
    apt-get install -y docker.io docker-compose git curl wget ufw fail2ban
    
    # Configure firewall
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    
    # Start Docker
    systemctl enable docker
    systemctl start docker
    
    # Create application directory
    mkdir -p /opt/rsp-studio
    
    # Install Caddy
    apt install -y debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt update
    apt install -y caddy
    
    # Configure Fail2Ban
    systemctl enable fail2ban
    systemctl start fail2ban
  EOF
}

resource "hcloud_firewall" "rsp_studio" {
  name = "rsp-studio-firewall"

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "80"
    source_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }
}

resource "hcloud_firewall_attachment" "rsp_studio" {
  firewall_id = hcloud_firewall.rsp_studio.id
  server_ids  = [hcloud_server.rsp_studio.id]
}

output "server_ip" {
  value       = hcloud_server.rsp_studio.ipv4_address
  description = "The public IP address of the server"
}

output "server_id" {
  value       = hcloud_server.rsp_studio.id
  description = "The ID of the server"
}
