import { useEffect, useState } from 'react';
import { ArrowRight, Mail, Phone, Users } from 'lucide-react';
import Navigation from './Navigation';
import Footer from './Footer';
import { fetchPublicMediaFiles, fetchPublicTeam } from '../utils/publicContentApi';
import { mediaRepository } from '../repositories/mediaRepository';
import { resolveBlogMediaReference } from '../features/blog/mediaReference';
import { PUBLIC_ROUTE_HASH } from '../features/marketing/publicRoutes';
import type { TeamMember } from '../domain/contentSchemas';

function TeamPhoto({ member }: { member: TeamMember }) {
  const media = resolveBlogMediaReference(member.photo, member.name);
  if (member.photo && media.src) {
    return <img src={media.src} alt={member.name} className="h-72 w-full object-cover transition duration-500 group-hover:scale-105" />;
  }

  return (
    <div className="flex h-72 w-full items-center justify-center bg-gradient-to-br from-[#e8f8fd] via-white to-[#e9fbf0] text-[#00b3e8]">
      <Users size={64} strokeWidth={1.5} />
    </div>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([fetchPublicMediaFiles(), fetchPublicTeam()])
      .then(([mediaFiles, team]) => {
        if (!active) return;
        mediaRepository.replaceAll(mediaFiles);
        setMembers(team);
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        console.warn('[team] public team sync failed', err);
        setError("L'équipe est temporairement indisponible. Veuillez réessayer plus tard.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <Navigation currentPath="/equipe" />
      <main className="min-h-screen bg-white pt-24">
        <section className="relative overflow-hidden bg-[#f5fbfd] py-24">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#00b3e8]/15 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-[#34c759]/15 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <p className="mb-5 inline-flex rounded-full bg-white px-5 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#00b3e8] shadow-sm">SMOVE Communication</p>
            <h1 className="font-['ABeeZee:Regular',sans-serif] text-5xl text-[#273a41] md:text-7xl">Notre équipe</h1>
            <p className="mx-auto mt-6 max-w-3xl font-['Abhaya_Libre:Regular',sans-serif] text-xl leading-relaxed text-[#52666d]">
              Découvrez les talents créatifs, stratégiques et techniques qui conçoivent des expériences digitales utiles, belles et performantes.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          {loading ? <div className="rounded-2xl border border-[#d8eef5] bg-[#f3fbfe] p-8 text-center text-[#2d6174]">Chargement de l'équipe…</div> : null}
          {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-800">{error}</div> : null}
          {!loading && !error && members.length === 0 ? <div className="rounded-2xl border border-[#d8eef5] p-8 text-center text-[#52666d]">Les profils de l'équipe seront bientôt publiés.</div> : null}

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <article key={member.id} className="group overflow-hidden rounded-[28px] border border-[#e1edf1] bg-white shadow-[0_20px_60px_rgba(20,51,63,0.08)]">
                <div className="overflow-hidden"><TeamPhoto member={member} /></div>
                <div className="p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-['ABeeZee:Regular',sans-serif] text-2xl text-[#273a41]">{member.name}</h2>
                      <p className="mt-1 text-sm font-semibold uppercase tracking-[0.14em] text-[#00b3e8]">{member.role}</p>
                    </div>
                    {member.featured ? <span className="rounded-full bg-[#34c759]/10 px-3 py-1 text-xs font-semibold text-[#249746]">Lead</span> : null}
                  </div>
                  <p className="mt-5 text-[16px] leading-relaxed text-[#52666d]">{member.bio}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {member.email ? <a className="rounded-full border border-[#d6e8ee] px-3 py-1.5 text-sm text-[#49636c] hover:border-[#00b3e8]" href={`mailto:${member.email}`}><Mail className="mr-1 inline" size={14} />Email</a> : null}
                    {member.phone ? <a className="rounded-full border border-[#d6e8ee] px-3 py-1.5 text-sm text-[#49636c] hover:border-[#00b3e8]" href={`tel:${member.phone}`}><Phone className="mr-1 inline" size={14} />Téléphone</a> : null}
                    {member.socialLinks.map((link) => <a key={`${member.id}-${link.platform}-${link.url}`} className="rounded-full border border-[#d6e8ee] px-3 py-1.5 text-sm text-[#49636c] hover:border-[#00b3e8]" href={link.url} target="_blank" rel="noreferrer">{link.label}</a>)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mb-20 max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[28px] bg-[#273a41] p-8 text-white shadow-2xl md:flex md:items-center md:justify-between md:p-10">
            <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7ee2ff]">Un projet en tête ?</p><h2 className="mt-2 text-3xl">Parlons de votre prochaine étape.</h2></div>
            <a href={PUBLIC_ROUTE_HASH.contact} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#00b3e8] px-6 py-3 font-semibold text-white transition hover:bg-[#0098c5] md:mt-0">Nous contacter <ArrowRight size={18} /></a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
