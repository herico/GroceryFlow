import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('@/pages/Home.vue') },
  { path: '/list/:id', name: 'list', component: () => import('@/pages/List.vue'), props: true },
  {
    path: '/list/:id/shopping',
    name: 'shopping',
    component: () => import('@/pages/Shopping.vue'),
    props: true,
  },
  { path: '/favorites', name: 'favorites', component: () => import('@/pages/Favorites.vue') },
  { path: '/settings', name: 'settings', component: () => import('@/pages/Settings.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})
