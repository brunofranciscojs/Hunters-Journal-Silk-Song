import { useEffect, useState, useRef } from 'react'
import Arrow from './components/arrowIcon';
import Loading from './components/Loading';
import { Analytics } from '@vercel/analytics/react';
import GitHubIcon from './components/GithubIcon';
import { useGamepadForEnemies } from './components/UseGamePad';
import select from './assets/select.mp3'

const BLOB_URL = 'https://vjjm30byfc5nljjh.public.blob.vercel-storage.com/inimigos.json';

function App() {
  const [enemies, setEnemies] = useState([])
  const [active, setActive] = useState(localStorage.getItem('ativo'));
  const [loading, setLoading] = useState(true);
  const divRef = useRef(null);
  const [play, setPlay] = useState(false);
  const audioRef = useRef(select);
  const [message, setMessage] = useState(0);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Detecta PWA install prompt
  useEffect(() => {
    // Já instalado ou já recusou?
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const dismissed = localStorage.getItem('install_dismissed');
    if (isStandalone || dismissed) return;

    // iOS/iPad detection
    const iosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (iosDevice) {
      setIsIOS(true);
      setShowInstallBanner(true);
      return;
    }

    // Android/Chrome: captura o evento nativo
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      // No iOS não dá pra trigger programático, banner já mostra instrução
      return;
    }
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setInstallPrompt(null);
    }
  };

  const dismissInstall = () => {
    setShowInstallBanner(false);
    localStorage.setItem('install_dismissed', 'true');
  };

  useEffect(() => {
    const getEnemies = async () => {

      try {
        const EXPIRATION_TIME = 720 * 60 * 60 * 1000;
        const cachedData = localStorage.getItem("enemies");
        const cachedTime = localStorage.getItem("enemies_timestamp");

        if (cachedData && cachedTime && Date.now() - cachedTime < EXPIRATION_TIME) {

          console.log("⚡ Usando cache local válido");
          setEnemies(JSON.parse(cachedData));
          return;
        }

        setLoading(true);
        console.log("🌐 Buscando do Vercel Blob...");

        const res = await fetch(BLOB_URL);
        const details = await res.json();

        localStorage.setItem("enemies", JSON.stringify(details));
        localStorage.setItem("enemies_timestamp", Date.now());
        setEnemies(details);

      } catch (err) {
        console.error("❌ Erro ao buscar inimigos:", err);
      } finally {
        setLoading(false);
      }
    };

    getEnemies();

    if (!localStorage.getItem('ativo')) localStorage.setItem('ativo', 'Aknid');
    setActive(localStorage.getItem('ativo'));

    // Deep-link: ?enemy=slug abre direto no inimigo (vindo da notificação)
    const params = new URLSearchParams(window.location.search);
    const enemySlug = params.get('enemy');
    if (enemySlug) {
      setActive(enemySlug);
      localStorage.setItem('ativo', enemySlug);
      // Limpa a query string sem reload
      window.history.replaceState({}, '', '/');
    }
  }, []);


  const ativar = (slug, el) => {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setActive(slug);
    const existentes = JSON.parse(localStorage.getItem('vistos')) || [];

    if (!existentes.includes(slug)) {
      existentes.push(slug);
    }

    localStorage.setItem('vistos', JSON.stringify(existentes));
    localStorage.setItem('ativo', slug);

    setPlay(true);
    setTimeout(() => {
      if (audioRef.current) {
        const audio = audioRef.current;

        audio.onended = () => {
          audio.currentTime = 0;
          setPlay(false);
        };

        audio.play();
      }
    }, 100);

  }

  useGamepadForEnemies({ enemies, active, setActive, divRef, ativar, setPlay, setMessage, message });

  // Pedir permissão de notificação e iniciar periodic notifications
  const requestNotifications = async () => {
    if (typeof Notification === 'undefined') return;

    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    localStorage.setItem('notif_asked', 'true');

    if (permission === 'granted') {
      // Avisa o SW pra começar as notificações
      const registration = await navigator.serviceWorker?.ready;
      if (registration) {
        // Tenta periodic sync
        if ('periodicSync' in registration) {
          try {
            await registration.periodicSync.register('hunter-journal-notification', {
              minInterval: 4 * 60 * 60 * 1000,
            });
          } catch {
            registration.active?.postMessage({ type: 'START_PERIODIC_NOTIFICATIONS' });
          }
        } else {
          registration.active?.postMessage({ type: 'START_PERIODIC_NOTIFICATIONS' });
        }
      }
    }
  };


  const scrollPagination = (d) => {
    if (!divRef.current) return;

    const isMobile = window.innerWidth < 1024;
    const step = 200;

    const currentScroll = isMobile
      ? divRef.current.scrollLeft
      : divRef.current.scrollTop;

    divRef.current.scrollTo({
      [isMobile ? 'left' : 'top']: d === "<" ? currentScroll - step : currentScroll + step,
      behavior: "smooth",
    });
  };



  if (loading) {
    return (
      <main className='hidden lg:flex gap-8 w-svw px-12 h-dvh items-end justify-center'>
        <section className='flex flex-col justify-center items-center gap-5 pt-20 before:hidden'>
          <Loading />
        </section>

        <section className='flex flex-col justify-center items-center gap-5 pt-20'>
          <Loading />
        </section>

        <section className='flex flex-col justify-center items-center gap-5 pt-20'>
          <Loading />
        </section>
      </main>
    );
  }

  return (
    <>
      {/* Banner de instalação PWA */}
      {showInstallBanner && (
        <div className='fixed top-0 left-0 right-0 z-9999 bg-linear-to-r from-[#2a2a3a] to-[#1a1a2e] border-b border-white/10 px-4 py-3 flex items-center justify-between gap-4 shadow-lg font-[calibri]'>
          <div className='flex items-center gap-3 text-white'>
            <span className='text-2xl'>📱</span>
            {isIOS ? (
              <span className='text-sm'>
                Instale o app: toque em <strong>Compartilhar</strong> <span className='text-lg'>⬆️</span> e depois <strong>"Adicionar à Tela de Início"</strong>
              </span>
            ) : (
              <span className='text-sm'>Instale o <strong>Hunter's Journal</strong> no seu dispositivo!</span>
            )}
          </div>
          <div className='flex gap-2 shrink-0'>
            {!isIOS && (
              <button
                onClick={handleInstall}
                className='bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-1.5 rounded-md transition-colors cursor-pointer font-semibold'
              >
                Instalar
              </button>
            )}
            <button
              onClick={dismissInstall}
              className='text-white/50 hover:text-white text-lg cursor-pointer px-2'
              title='Fechar'
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {message === 1 &&
        <span className='fixed bottom-4 left-4 bg-green-400/70 backdrop-blur-sm text-white px-4 py-2 rounded-md z-999 font-[calibri]'>
          Gamepad connected! Use the D-Pad or analog stick to navigate.
        </span>
      }
      {play && <audio src={select} autoPlay className='absolute opacity-0' ref={audioRef}></audio>}

      <main className='flex gap-8 w-full lg:px-12 px-2 h-full items-center justify-center lg:flex-row flex-col relative'>
        <section className='flex lg:flex-col flex-row justify-center items-center gap-5 lg:pt-20 pt-10'>

          <Arrow className={'mx-auto block cursor-pointer z-50 lg:relative absolute lg:top-5 top-[unset] lg:left-0 -left-10 lg:rotate-0 -rotate-90 scale-50 lg:scale-100'} onClick={() => scrollPagination('<')} />

          <div className='relative z-10 w-full after:content-[""] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-[linear-gradient(to_bottom,#5550,#555,#555,#5550)]'>
            <div className='h-20 bg-[linear-gradient(to_bottom,#222_10%,transparent_100%)] absolute top-0 left-0 w-full z-10 pointer-events-none opacity-60 lg:opacity-100 lg:flex hidden '></div>
            <ul className="mask-[linear-gradient(to_left,#0000,#000,#000,#0000)] lg:mask-[linear-gradient(to_left,#000,#000,#000,#000)] gap-10 lg:overflow-x-hidden overflow-x-auto! py-12 grid lg:w-full grid-rows-2 grid-flow-col auto-cols-[100px] w-max max-w-full lg:h-full flex-row lg:overflow-y-auto overflow-y-hidden lg:max-h-[590px] max-h-[300px] whitespace-normal lg:flex px-10 flex-wrap relative mx-auto justify-center items-center gap-y-10 z-0 [&::-webkit-scrollbar]:w-0" ref={divRef}>
              {enemies.slice(1).map((enemy, key) => (
                <li key={key} data-visto={JSON.parse(localStorage.getItem('vistos') || '[]').includes(enemy.slug)}
                  className={`w-auto min-w-[110px] lg:min-w-[unset] relative cursor-pointer hover:brightness-150 hover:saturate-150 hover:opacity-100 transition-all opacity-90`}
                  title={enemy.name} data-active={active === enemy.slug} onClick={(e) => ativar(enemy.slug, e.target)}>
                  <img src={enemy.image} className='rounded-full w-20 h-20 border-4 border-white/50 block object-cover mx-auto transition-all duration-200 object-top' />
                </li>
              ))
              }
            </ul>
            <div className='h-24 bg-[linear-gradient(to_top,#222_10%,transparent_100%)] absolute bottom-0 left-0 w-full z-10 pointer-events-none opacity-60 lg:opacity-100 lg:flex hidden '></div>
          </div>

          <Arrow className={'mx-auto block cursor-pointer z-50 lg:relative absolute lg:right-0 lg:bottom-5 bottom-[unset] -right-10 lg:rotate-0 -rotate-90 scale-[.5_-.5] lg:scale-[1_-1]'} onClick={() => scrollPagination('>')} />
        </section>

        <section className='max-h-120 lg:max-h-[unset] min-h-77 lg:min-h-[unset] relative h-dvh'>
          {active && (() => {
            const enemy = enemies.find(e => e.slug.toLowerCase() === active.toLowerCase());
            return (
              <div className="place-content-center w-full mx-auto relative">
                <img src={enemy.image} key={enemy.slug} alt={enemy.name} className={`block mx-auto w-auto relative min-h-[500px] h-full max-h-[600px] aspect-square z-10 brightness-120 saturate-[1.8] object-contain`} />
                <div className="blur-[5rem] rounded-full absolute z-0 w-[300px] h-[300px] left-1/2 top-1/2 [translate:-50%_-50%] saturate-[2] bg-cover bg-center bg-[#5557]" />
              </div>
            );
          })()}
        </section>

        <section>
          {active && (() => {
            const enemy = enemies.find(e => e.slug.toLowerCase() === active.toLowerCase());
            if (!enemy) return null;

            return (
              <div className='place-content-center w-full mx-auto relative lg:px-10 px-4 flex justify-between flex-col h-full py-12 gap-24 
                        after:content-[""] after:absolute after:left-0 after:top-1/2 after:h-[80%] after:-translate-y-1/2 after:w-px after:bg-[linear-gradient(to_bottom,#5550,#555,#555,#5550)]'>
                <div>
                  <h2 className='font-bold text-4xl text-white text-center mb-7'>{enemy.name}</h2>
                  <span className='block max-w-[85%] mx-auto text-2xl text-white/60'>{enemy.description}</span>
                </div>

                {enemy.hornetDescription !== '...' &&
                  <div>
                    <img className="mx-auto block w-auto mb-7 content-[url(./assets/hd.png)]" />
                    <span className='block max-w-[85%] mx-auto text-2xl text-white/60'>{enemy.hornetDescription}</span>
                  </div>
                }

                <div className='h-12 opacity-0'>

                </div>
              </div>
            );
          })()}

        </section>
        <div className='flex items-center gap-6 justify-center absolute bottom-0 w-full text-gray-400 text-lg'>
          <a className='flex items-center gap-2'
            href='https://github.com/brunofranciscojs/Hunters-Journal-Silk-Song' target='_blank'>
            <GitHubIcon width={15} height={15} fill={'#99a1af'} />see on github
          </a>

          {notifPermission !== 'granted' && !localStorage.getItem('notif_asked') && (
            <button
              onClick={requestNotifications}
              className='flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer'
              title='Receber notificações de inimigos'
            >
              🔔 notifications
            </button>
          )}
        </div>
      </main>
      <Analytics />
    </>
  )
}

export default App
