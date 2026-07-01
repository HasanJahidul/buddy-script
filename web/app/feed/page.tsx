import { redirect } from 'next/navigation';
import { getCurrentUser, getInitialFeed } from '@/lib/server-api';
import Header from '@/components/layout/Header';
import FeedClient from '@/components/feed/FeedClient';

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
              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
                <div className="_layout_left_sidebar_wrap">
                  <div className="_left_inner_area_menu _b_radious6 _padd_t24 _padd_b24 _padd_r24 _padd_l24 _mar_b16">
                    <h4 className="_left_inner_area_menu_title _mar_b24">
                      Welcome, {user.firstName}
                    </h4>
                    <p className="_muted_note" style={{ textAlign: 'left' }}>
                      Share what&apos;s on your mind. Public posts are visible to
                      everyone; private posts only to you.
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
                <div className="_layout_middle_wrap">
                  <FeedClient currentUser={user} initial={initial} />
                </div>
              </div>

              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
                <div className="_layout_right_sidebar_wrap">
                  <div className="_right_inner_area_card _b_radious6 _padd_t24 _padd_b24 _padd_r24 _padd_l24">
                    <h4 className="_right_inner_area_card_title _mar_b24">
                      Buddy Script
                    </h4>
                    <p className="_muted_note" style={{ textAlign: 'left' }}>
                      A simple social feed — post, like, comment and reply.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
