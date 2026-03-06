# README V5 — Plateforme stratégique SMOVE

Ce document décrit le socle V5 implémenté de manière modulaire et rétrocompatible.

## Modules livrés (partiel V5)
- Personalization rules engine (segments, variantes, règles).
- Global search CMS transverse.
- Lead model + formulaires publics orientés conversion.
- Job queue abstraite + runner interne.
- Documentation d’architecture, intégrations et sécurité enterprise.

## Feature flags
- `FEATURE_V5_PERSONALIZATION`
- `FEATURE_V5_GLOBAL_SEARCH`
- `FEATURE_V5_LEADS`
- `FEATURE_V5_JOBS`
- `JOB_RUNNER_TOKEN`

## Objectif de déploiement
Activer progressivement module par module sans casser les routes publiques historiques.
