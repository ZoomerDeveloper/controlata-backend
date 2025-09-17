#!/bin/bash

echo "🔍 Проверка DNS для api.art24.me"
echo "================================"

echo "1. Проверка через локальный DNS:"
nslookup api.art24.me

echo -e "\n2. Проверка через Google DNS:"
nslookup api.art24.me 8.8.8.8

echo -e "\n3. Проверка через Cloudflare DNS:"
nslookup api.art24.me 1.1.1.1

echo -e "\n4. Проверка через whois:"
whois api.art24.me | grep -i "name server\|dns"

echo -e "\n5. Проверка API (если DNS работает):"
curl -I https://api.art24.me/health 2>/dev/null || echo "API недоступен"

echo -e "\n================================"
echo "✅ Если видите IP 66.33.22.136 - DNS настроен правильно!"
echo "⏰ Если NXDOMAIN - подождите еще 15-30 минут"
