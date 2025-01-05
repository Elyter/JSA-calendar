# JSA Calendar - Système de Réservation de Terrains

## Description
JSA Calendar est une application web de gestion des réservations de terrains sportifs. Elle permet de visualiser et gérer les créneaux horaires pour différents terrains, avec un système d'administration sécurisé.

## Fonctionnalités
- Visualisation des réservations par weekend
- Interface d'administration protégée par mot de passe
- Gestion des réservations (création, modification, suppression)
- Support pour différents types d'événements (matchs, entraînements)
- Gestion des conflits de réservation
- Interface responsive et intuitive

## Technologies Utilisées
- Next.js 14
- React 18
- Express.js
- Tailwind CSS
- React Big Calendar
- Moment.js
- Axios

## Prérequis
- Node.js (v18 ou supérieur)
- npm ou yarn

## Installation

1. Cloner le repository
```bash
bash
git clone [URL_DU_REPO]
cd jsa-calendar
```
2. Installer les dépendances
```bash
npm install

ou

yarn install
```
3. Lancer le serveur de développement
```bash
Terminal 1 - Frontend

npm run dev

ou

yarn dev

Terminal 2 - Backend

node api/server.js
```

4. Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur

## Configuration
- Le serveur backend tourne sur le port 3001
- Le mot de passe d'administration par défaut est 'test'
- Les données sont stockées dans `api/data.json`

## Structure du Projet
- `/src/app` - Pages et configuration Next.js
- `/src/components` - Composants React
- `/api` - Serveur Express et données
- `/public` - Assets statiques

## Contribution
Les contributions sont les bienvenues ! Veuillez suivre ces étapes :
1. Forker le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## Licence
MIT

## Contact
Eliott B. - [EliottB.dev](https://eliottb.dev)
