import { useEffect, useState, useRef } from 'react'
import Arrow from './components/arrowIcon';
import Loading from './components/Loading';
const apiURL1 = import.meta.env.VITE_API_URL1
const apiURL2 = import.meta.env.VITE_API_URL2

function App() {
  const [enemies, setEnemies] = useState([])
  const [active,setActive] = useState('Lace');
  const [loading, setLoading] = useState(true); 
  const divRef = useRef(null);

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
            const res = await fetch(
              `${apiURL2}/${enemy.slug}`
            );
            const detail = await res.json();

            return {
              ...enemy,
              image: detail.image,
              description: detail.description,
              hornetDescription: detail.hornetDescription,
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

}, []);

  const ativar = (slug,el) =>{
    el.scrollIntoView({behavior:'smooth',block:'center'})
    setActive(slug)
  }

  const scrollPagination = (d) => {
    if (divRef.current) {
      const currentScroll = divRef.current.scrollTop;
      const step = 200;

      divRef.current.scrollTo({
        top: d === "<" ? currentScroll - step : currentScroll + step,
        behavior: "smooth",
      });
    }
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
      <main className='flex gap-8 w-full lg:px-12 px-4 h-full items-center justify-center lg:flex-row flex-col relative'>
        <section className='flex flex-col justify-center items-center gap-5 lg:pt-20 pt-10'>

          <Arrow className={'mx-auto block cursor-pointer z-50 relative'} onClick={() =>scrollPagination('<')}/>
          
          <div className='relative z-10 w-full after:content-[""] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-[linear-gradient(to_bottom,#5550,#555,#555,#5550)]'>
            <div className='h-20 bg-[linear-gradient(to_bottom,#222_10%,transparent_100%)] absolute top-0 left-0 w-full z-10 pointer-events-none opacity-60 lg:opacity-100'></div>
            <ul className="py-12 w-full h-full overflow-y-auto lg:max-h-[590px] max-h-80 flex px-10 flex-wrap relative mx-auto justify-center items-center gap-y-10 z-0 [&::-webkit-scrollbar]:w-0" ref={divRef}>
              {enemies.slice(1).map((enemy, key) => (
                <li key={key} className={`lg:w-1/3 w-2/12 relative cursor-pointer hover:brightness-150 hover:saturate-150 hover:opacity-100 transition-all opacity-90`} title={enemy.name} data-active={active === enemy.slug} onClick={(e) => ativar(enemy.slug,e.target)}>
                  <img  src={enemy.image} className='rounded-full w-20 h-20 border-3 border-white/80 block object-cover mx-auto transition-all duration-200' />
                </li>
                ))
              }
            </ul>
            <div className='h-24 bg-[linear-gradient(to_top,#222_10%,transparent_100%)] absolute bottom-0 left-0 w-full z-10 pointer-events-none opacity-60 lg:opacity-100'></div>
          </div>
  
          <Arrow className={'mx-auto block scale-[1_-1] cursor-pointer z-50'} onClick={() =>scrollPagination('>')}/>
        </section>
  
        <section className='max-h-120 lg:max-h-[unset] min-h-77 lg:min-h-[unset]'>
            {active && (() => {
              const enemy = enemies.find(e => e.slug === active);
              return (
                <div className="place-content-center w-full mx-auto relative">
                  <img src={enemy.image} key={enemy.slug} alt={enemy.name} className={`block mx-auto w-auto relative lg:min-w-120 min-w-44 z-10 brightness-150 saturate-[1.5] object-contain`} />
                  {enemy && (
                    <div
                      className="blur-[5rem] rounded-full absolute z-0 w-[300px] h-[300px] left-1/2 top-1/2 [translate:-50%_-50%] saturate-[2] bg-cover bg-center"
                      style={{ backgroundImage: `url(${enemy.image})` }}
                    />
                  )}
                </div>
              );
            })()}
        </section>
  
        <section>
            {active && (() => {
              const enemy = enemies.find(e => e.slug === active);
              if (!enemy) return null;
  
              return (
                  <div className='place-content-center w-full mx-auto relative px-10 flex justify-between flex-col h-full py-12 gap-24 
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
      </main>
    </>
  )
}

export default App
