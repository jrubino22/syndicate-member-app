import Link from 'next/link';

const Index = ({ member }) => {
  return (
    <div className="flex-container">
      <div className="menu-container">
        <ul>
          <li>
            <Link href="/">
              <a className="bold menu-txt">Registered Members</a>
            </Link>
          </li>
          <li>
            <Link href="/sent-cards"><a className="menu-txt">Sent & Unregistered</a></Link>
          </li>
          <li>
            <Link href="/unregistered-cards"><a className="menu-txt">Unsent Cards</a></Link>
          </li>
        </ul>
      </div>
      <div className="content-container">
        {member.map(({ _Id, customerEmail, cardTier, accountNumber }) => (
          <div key={_Id} className="border">
            <p>
              <span> Customer Email: {customerEmail} </span>|
              <span> Membership Tier: {cardTier} </span>|
              <span> Account Number: {accountNumber} </span>
              <Link
                key={_Id}
                href={`/view-member/${accountNumber}`}
                className="editButton"
              >
                <button className="editButton">View Member</button>
              </Link>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export async function getServerSideProps() {
  const response = await fetch(
    'https://syndicate-member.herokuapp.com/api/members'
  );
  const data = await response.json();

  return {
    props: {
      member: data,
    },
  };
}

export default Index;
