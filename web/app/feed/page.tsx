import { redirect } from 'next/navigation';
import { getCurrentUser, getInitialFeed } from '@/lib/server-api';
import Header from '@/components/layout/Header';
import FeedClient from '@/components/feed/FeedClient';
import Stories from '@/components/feed/Stories';
import { LeftSidebar, RightSidebar } from '@/components/feed/FeedSidebars';

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const initial = await getInitialFeed();

  return (
    <div className="_layout _layout_main_wrapper">
      <div className="_main_layout">
        <Header user={user} />
        <div className="container _custom_container">
          <div className="_layout_inner_wrap">
            <div className="row">
              <LeftSidebar />

              <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
                <div className="_layout_middle_wrap">
                  <Stories />
                  <FeedClient currentUser={user} initial={initial} />
                </div>
              </div>

              <RightSidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
