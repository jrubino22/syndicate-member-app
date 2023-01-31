import Link from 'next/link';

const Index = ({ member }) => {

  return (

    <div>
      
      {member.map(({_Id, customerEmail, cardTier, accountNumber}) => (
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
