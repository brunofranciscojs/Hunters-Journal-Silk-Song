import { useEffect, useState, useRef } from 'react'
import Arrow from './components/arrowIcon';
import Loading from './components/Loading';
import { Analytics } from '@vercel/analytics/react';
import GitHubIcon from './components/GithubIcon';
const apiURL1 = import.meta.env.VITE_API_URL1
const apiURL2 = import.meta.env.VITE_API_URL2
import { useGamepadForEnemies } from './components/UseGamePad';




function App() {
  const [enemies, setEnemies] = useState([])
  const [active, setActive] = useState(localStorage.getItem('ativo'));
  const [loading, setLoading] = useState(true); 
  const divRef = useRef(null);
  const [play, setPlay] = useState(false);
  const audioRef = useRef();

  useEffect(() => {
    const getEnemies = async () => {

      try {
        const EXPIRATION_TIME = 72 * 60 * 60 * 1000;
        const cachedData = localStorage.getItem("enemies");
        const cachedTime = localStorage.getItem("enemies_timestamp");

        if (cachedData && cachedTime && Date.now() - cachedTime < EXPIRATION_TIME) {
          
          console.log("⚡ Usando cache local válido");
          setEnemies(JSON.parse(cachedData));
          return;
        }

        setLoading(true);
        console.log("🌐 Buscando da API...");

        const res = await fetch(apiURL1);
        const data = await res.json();
        const enemiesList = data.data;

        const details = await Promise.all(
        enemiesList.map(async (enemy) => {

          const res = await fetch(`${apiURL2}/${enemy.slug}`);
            const detail = await res.json();

            return {
              ...enemy,
              image: detail.image || null,
              description: detail.description || 'No description available',
              hornetDescription: detail.hornetDescription || 'No description',
              location: detail.stats?.location || 'Various Places',
            };
          
        })
      );

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

  if (!localStorage.getItem('ativo')) localStorage.setItem('ativo','Aknid');
  setActive(localStorage.getItem('ativo'))
}, []);


  const ativar = (slug,el) =>{
    el.scrollIntoView({behavior:'smooth',block:'center'})
    setActive(slug);
    const existentes = JSON.parse(localStorage.getItem('vistos')) || [];
    
    if (!existentes.includes(slug)) {
      existentes.push(slug);
    }
    
    localStorage.setItem('vistos', JSON.stringify(existentes));
    localStorage.setItem('ativo',slug);

    setPlay(true);
    setTimeout(() => {
      if (audioRef.current) {
        const audio = audioRef.current;
        audio.volume = 0.5;

        audio.onended = () => {
          audio.currentTime = 0;
          setPlay(false);
        };

        audio.play(); // se quiser iniciar o som aqui
      }
    }, 100);

  }

  useGamepadForEnemies({ enemies, active, setActive, divRef, ativar, setPlay});

  
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
      {play && <audio src="./src/assets/select.mp3" autoPlay controls className='absolute opacity-0' ref={audioRef}> </audio>}

      <main className='flex gap-8 w-full lg:px-12 px-2 h-full items-center justify-center lg:flex-row flex-col relative'>
        <section className='flex lg:flex-col flex-row justify-center items-center gap-5 lg:pt-20 pt-10'>

          <Arrow className={'mx-auto block cursor-pointer z-50 lg:relative absolute lg:top-5 top-[unset] lg:left-0 -left-10 lg:rotate-0 -rotate-90 scale-50 lg:scale-100'} onClick={() =>scrollPagination('<')}/>
          
          <div className='relative z-10 w-full after:content-[""] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-[linear-gradient(to_bottom,#5550,#555,#555,#5550)]'>
            <div className='h-20 bg-[linear-gradient(to_bottom,#222_10%,transparent_100%)] absolute top-0 left-0 w-full z-10 pointer-events-none opacity-60 lg:opacity-100 lg:flex hidden '></div>
            
            <ul className="mask-[linear-gradient(to_left,#0000,#000,#000,#0000)] lg:mask-[linear-gradient(to_left,#000,#000,#000,#000)] gap-10 lg:overflow-x-hidden overflow-x-auto! py-12 grid lg:w-full grid-rows-2 grid-flow-col auto-cols-[100px] w-max max-w-full lg:h-full flex-row lg:overflow-y-auto overflow-y-hidden lg:max-h-[590px] max-h-[300px] whitespace-normal lg:flex px-10 flex-wrap relative mx-auto justify-center items-center gap-y-10 z-0 [&::-webkit-scrollbar]:w-0" ref={divRef}>
              {enemies.slice(1).map((enemy, key) => (
                <li key={key} data-visto={JSON.parse(localStorage.getItem('vistos') || '[]').includes(enemy.slug)} className={`w-auto min-w-[110px] lg:min-w-[unset] relative cursor-pointer hover:brightness-150 hover:saturate-150 hover:opacity-100 transition-all opacity-90`} 
                    title={enemy.name} data-active={active === enemy.slug} onClick={(e) => ativar(enemy.slug,e.target)}>
                  <img  src={enemy.image} className='rounded-full w-20 h-20 border-3 border-white/80 block object-cover mx-auto transition-all duration-200 object-top' />
                </li>
                ))
              }
            </ul>

            <div className='h-24 bg-[linear-gradient(to_top,#222_10%,transparent_100%)] absolute bottom-0 left-0 w-full z-10 pointer-events-none opacity-60 lg:opacity-100 lg:flex hidden '></div>
          </div>
  
          <Arrow className={'mx-auto block cursor-pointer z-50 lg:relative absolute lg:right-0 lg:bottom-5 bottom-[unset] -right-10 lg:rotate-0 -rotate-90 scale-[.5_-.5] lg:scale-[1_-1]'} onClick={() =>scrollPagination('>')}/>
        </section>
  
        <section className='max-h-120 lg:max-h-[unset] min-h-77 lg:min-h-[unset] relative h-dvh'>
            {active && (() => {
              const enemy = enemies.find(e => e.slug === active);
              return (
                <div className="place-content-center w-full mx-auto relative">
                  <img src={enemy.image} key={enemy.slug} alt={enemy.name} className={`block mx-auto w-auto relative min-h-[500px] h-full max-h-[600px] aspect-square z-10 brightness-120 saturate-[1.8] object-contain`} />
                  <div className="blur-[5rem] rounded-full absolute z-0 w-[300px] h-[300px] left-1/2 top-1/2 [translate:-50%_-50%] saturate-[2] bg-cover bg-center bg-[#5557]"/>
                </div>
              );
            })()}
        </section>
  
        <section>
            {active && (() => {
              const enemy = enemies.find(e => e.slug === active);
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
      <a className='flex items-center gap-4 justify-center absolute bottom-0 w-full text-gray-400 text-lg' 
        href='https://github.com/brunofranciscojs/Hunters-Journal-Silk-Song' target='_blank'>
          <GitHubIcon width={15} height={15} fill={'#99a1af'}/>see on github
      </a>
      </main>
      <Analytics />
    </>
  )
}

export default App
