import Link from 'next/link';

const SentCards = ({ card }) => {
  return (
    <div>
      <div className="menu-container">
        <ul>
          <li>
            <Link href="/">
              <a className="menu-txt">Registered Members</a>
            </Link>
          </li>
          <li>
            <Link href="/sent-cards">
              <a className="bold menu-txt">Sent & Unregistered</a>
            </Link>
          </li>
          <li>
            <Link href="/unregistered-cards">
            <a className="menu-txt">Unsent Cards</a>
            </Link>
          </li>
        </ul>
      </div>
      <div className="content-container">
        {card
          .filter(function ({ sent }) {
            if (sent === false) {
              return false;
            }
            return true;
          })
          .map(({ _Id, memberId, sentTo }) => (
            <div key={_Id} className="border">
              <p>
                <span> ID Number: {memberId} </span>
                <span> Sent to: {sentTo}</span>
              </p>
            </div>
          ))}
      </div>
    </div>
  );
};

export async function getServerSideProps() {
  const response = await fetch(
    'https://syndicate-member.herokuapp.com/api/unregistered'
  );
  const data = await response.json();

  return {
    props: {
      card: data,
    },
  };
}

export default SentCards;