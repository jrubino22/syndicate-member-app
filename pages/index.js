import session from 'koa-session';
import Link from 'next/link';
import { useState } from 'react';

const Index = ({ member, error }) => {


  if (error) {
    return <div>{error.message}</div>;
  }
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    const filteredCards = member.filter(function ({ customerEmail }) {
      return customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    });
    setSearchResults(filteredCards);
  };

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
            <Link href="/sent-cards">
              <a className="menu-txt">Sent & Unregistered</a>
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
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by email"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        {searchResults.length > 0
          ? searchResults.map(
              ({ _Id, customerEmail, cardTier, accountNumber }) => (
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
              )
            )
          : member.map(({ _Id, customerEmail, cardTier, accountNumber }) => (
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

export async function getServerSideProps(context) {
  try {
    const response = await fetch('https://member.vsyndicate.com/api/members',
    {
      headers: {
        cookie: req.headers.cookie
      }
    }
  );
  const data = await response.json();

    return {
      props: {
        member: data,
      },
    };
  } catch (error) {
    return {
      props: {
        error: { message: "Shopify access token is required" },
      },
    };
  }
}

export default Index;
