import HomePage from '../pages/home/home-page';
import AboutPage from '../pages/about/about-page';
import StoryPage from '../pages/story/story-page';
import StoryDetailPage from '../pages/story/detail-page';
import AddStoryPage from '../pages/add-story/add-story-page';
import LoginPage from '../pages/auth/login-page';
import RegisterPage from '../pages/auth/register-page';
import NotFoundPage from '../pages/not-found/not-found-page';

const routes = {
  '/': new HomePage(),
  '/about': new AboutPage(),
  '/stories': new StoryPage(),
  '/stories/:id': new StoryDetailPage(),
  '/add-story': new AddStoryPage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),
  '*': new NotFoundPage(),
};

export default routes;