// ===== Notificações Periódicas do Hunter's Journal =====

const BLOB_URL = 'https://vjjm30byfc5nljjh.public.blob.vercel-storage.com/inimigos.json';
const NOTIFICATION_INTERVAL = 4 * 60 * 60 * 1000; // 4 horas

// Busca lista de inimigos (do cache ou rede)
async function getEnemiesList() {
    try {
        // Tenta do cache primeiro
        const cache = await caches.open('blob-json-cache');
        let response = await cache.match(BLOB_URL);

        if (!response) {
            response = await fetch(BLOB_URL);
            await cache.put(BLOB_URL, response.clone());
        }

        return await response.json();
    } catch (err) {
        console.error('❌ SW: Erro ao buscar inimigos:', err);
        return [];
    }
}

// Envia notificação com inimigo aleatório
async function sendRandomEnemyNotification() {
    const enemies = await getEnemiesList();
    if (enemies.length === 0) return;

    const enemy = enemies[Math.floor(Math.random() * enemies.length)];

    const location = Array.isArray(enemy.location)
        ? enemy.location[0]
        : enemy.location || 'Unknown';

    await self.registration.showNotification("Hunter's Journal 🗡️", {
        body: `confira ${enemy.name} — encontrado em ${location}`,
        icon: enemy.image || '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'hunter-journal-enemy',
        renotify: true,
        data: { slug: enemy.slug, url: `/?enemy=${enemy.slug}` },
        actions: [
            { action: 'open', title: 'Ver inimigo' },
        ],
    });
}

// === Periodic Background Sync (Chrome PWA instalado) ===
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'hunter-journal-notification') {
        event.waitUntil(sendRandomEnemyNotification());
    }
});

// === Fallback: message do app pedindo notificação ===
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SEND_NOTIFICATION') {
        event.waitUntil(sendRandomEnemyNotification());
    }

    if (event.data && event.data.type === 'START_PERIODIC_NOTIFICATIONS') {
        // Inicia intervalo como fallback quando periodic sync não é suportado
        startPeriodicNotifications();
    }
});

// Fallback com setInterval (funciona enquanto o SW estiver ativo)
let notificationInterval = null;

function startPeriodicNotifications() {
    if (notificationInterval) return;

    notificationInterval = setInterval(() => {
        sendRandomEnemyNotification();
    }, NOTIFICATION_INTERVAL);

    // Envia uma após 30 segundos como "boas-vindas"
    setTimeout(() => {
        sendRandomEnemyNotification();
    }, 30 * 1000);
}

// === Click na notificação: abre o app no inimigo ===
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Se já tem uma aba aberta, foca e navega
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin)) {
                    client.focus();
                    client.navigate(url);
                    return;
                }
            }
            // Senão abre nova aba
            return clients.openWindow(url);
        })
    );
});
