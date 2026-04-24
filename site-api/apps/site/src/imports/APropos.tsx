import { motion } from 'motion/react';
import { ArrowRight, Award, BriefcaseBusiness, Sparkles, Users } from 'lucide-react';
import { PUBLIC_ROUTE_HASH } from '../features/marketing/publicRoutes';

const values = [
  {
    title: 'Exigence',
    description: 'Chaque livrable est pensé pour être utile, mesurable et aligné avec vos objectifs business.',
  },
  {
    title: 'Clarté',
    description: 'Nous simplifions les sujets complexes pour créer des messages compréhensibles et crédibles.',
  },
  {
    title: 'Impact',
    description: 'Design, contenu et diffusion travaillent ensemble pour générer des résultats concrets.',
  },
];

const trustHighlights = [
  {
    icon: BriefcaseBusiness,
    title: 'Accompagnement end-to-end',
    description: 'De la stratégie éditoriale à la production, nous pilotons les projets de bout en bout.',
  },
  {
    icon: Users,
    title: 'Équipe pluridisciplinaire',
    description: 'Consultants, designers et spécialistes digitaux coordonnés autour de votre marque.',
  },
  {
    icon: Award,
    title: 'Méthode orientée performance',
    description: 'Des choix créatifs guidés par la data, les retours terrain et les objectifs de conversion.',
  },
];

export default function APropos() {
  return (
    <main className="relative overflow-hidden bg-gradient-to-b from-[#f3f9fb] via-white to-white text-[#273a41]">
      <div className="pointer-events-none absolute left-1/2 top-8 h-80 w-80 -translate-x-1/2 rounded-full bg-[#00b3e8]/15 blur-3xl" />

      <section className="relative mx-auto max-w-7xl px-4 pb-14 pt-14 sm:px-6 lg:px-8 lg:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="rounded-[30px] border border-[#d9ecf2] bg-white/80 p-8 backdrop-blur md:p-12"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-[#00b3e8]/10 px-4 py-2 font-['Medula_One:Regular',sans-serif] text-[14px] uppercase tracking-[1.4px] text-[#00a0cf]">
            <Sparkles size={15} />
            À propos de SMOVE
          </span>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr,0.8fr] lg:items-end">
            <div>
              <h1 className="font-['ABeeZee:Regular',sans-serif] text-[40px] leading-[1.08] md:text-[58px] lg:text-[72px]">
                Une communication
                <br />
                qui inspire confiance
              </h1>
              <p className="mt-6 max-w-2xl font-['Abhaya_Libre:Regular',sans-serif] text-[20px] leading-relaxed text-[#3b4f56]">
                Nous aidons les entreprises et institutions à clarifier leur message, structurer leur présence digitale
                et accélérer leur croissance grâce à des dispositifs modernes, cohérents et durables.
              </p>
            </div>
            <div className="rounded-[24px] border border-[#dbebf0] bg-gradient-to-br from-[#0f2531] to-[#1c3a49] p-6 text-white shadow-[0_20px_70px_rgba(12,32,45,0.25)]">
              <p className="font-['Medula_One:Regular',sans-serif] text-[14px] uppercase tracking-[1.4px] text-white/80">Notre mission</p>
              <p className="mt-3 font-['Abhaya_Libre:Regular',sans-serif] text-[22px] leading-snug">
                Concevoir des expériences de marque qui alignent stratégie, création et performance.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {values.map((value, index) => (
            <motion.article
              key={value.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="rounded-[22px] border border-[#e1eef2] bg-white p-6 shadow-[0_8px_30px_rgba(20,47,59,0.08)]"
            >
              <h2 className="font-['Medula_One:Regular',sans-serif] text-[24px] uppercase tracking-[1.7px] text-[#273a41]">{value.title}</h2>
              <p className="mt-3 font-['Abhaya_Libre:Regular',sans-serif] text-[18px] leading-relaxed text-[#445a62]">{value.description}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.95fr,1.05fr] lg:items-center">
          <div className="rounded-[28px] border border-[#d8e9ef] bg-[#f7fcfe] p-8 md:p-10">
            <p className="font-['Medula_One:Regular',sans-serif] text-[14px] uppercase tracking-[1.4px] text-[#00a0cf]">Notre histoire</p>
            <h2 className="mt-3 font-['ABeeZee:Regular',sans-serif] text-[34px] leading-tight md:text-[44px]">Du conseil local à l’impact régional.</h2>
            <p className="mt-4 font-['Abhaya_Libre:Regular',sans-serif] text-[19px] leading-relaxed text-[#3f545b]">
              Née de la volonté de professionnaliser la communication institutionnelle et corporate, SMOVE accompagne
              des organisations qui veulent mieux raconter ce qu’elles font, pourquoi elles le font, et comment elles
              créent de la valeur.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {trustHighlights.map((item) => (
              <article key={item.title} className="rounded-[22px] border border-[#e2eef2] bg-white p-5">
                <div className="inline-flex rounded-xl bg-[#00b3e8]/10 p-3 text-[#00a4d5]">
                  <item.icon size={20} />
                </div>
                <h3 className="mt-4 font-['Abhaya_Libre:Bold',sans-serif] text-[20px] leading-tight text-[#273a41]">{item.title}</h3>
                <p className="mt-2 font-['Abhaya_Libre:Regular',sans-serif] text-[17px] leading-relaxed text-[#4a6068]">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          className="rounded-[28px] bg-gradient-to-r from-[#00b3e8] to-[#01c8ef] p-8 text-white md:p-10"
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-['Medula_One:Regular',sans-serif] text-[14px] uppercase tracking-[1.4px] text-white/90">Construisons ensemble</p>
              <h2 className="mt-3 font-['ABeeZee:Regular',sans-serif] text-[32px] leading-tight md:text-[44px]">Parlons de votre prochain projet.</h2>
            </div>
            <a
              href={PUBLIC_ROUTE_HASH.contact}
              className="inline-flex items-center gap-2 self-start rounded-full bg-white px-7 py-4 font-['Abhaya_Libre:Bold',sans-serif] text-[17px] text-[#0c718f] transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Contacter SMOVE
              <ArrowRight size={18} />
            </a>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
