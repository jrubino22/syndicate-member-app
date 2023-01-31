import Link from 'next/link';

const UnregisteredCards = ({ card }) => {
  return (
    <div>
      <div>
        <ul>
          <li>
            <Link href="/"><a className="menu-txt">Registered Members</a></Link>
          </li>
          <li>
            <Link href="/sent-cards"><a className="menu-txt">Sent & Unregistered</a></Link>
          </li>
          <li>
            <Link href="/unregistered-cards">
              <a className="bold menu-txt">Unsent Cards</a>
            </Link>
          </li>
        </ul>
      </div>
      <div>
        {card.sent !== true &&
          card.map(({ _Id, memberId }) => (
            <div key={_Id} className="border">
              <p>
                <span> ID Number: {memberId} </span>
                <Link
                  key={_Id}
                  href={`/unregistered-cards`}
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
    'https://syndicate-member.herokuapp.com/api/unregistered'
  );
  const data = await response.json();

  return {
    props: {
      card: data,
    },
  };
}

export default UnregisteredCards;
