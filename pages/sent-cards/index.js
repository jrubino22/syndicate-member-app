import Link from 'next/link';
import { useState } from 'react';

const SentCards = ({ card }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    const filteredCards = card.filter(function ({ memberId }) {
      return memberId.toLowerCase().includes(searchTerm.toLowerCase());
    });
    setSearchResults(filteredCards);
  };

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
      <div className="search-container">
          <input
            type="text"
            placeholder="Search by ID"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>  
        {searchResults.length > 0
          ? searchResults.filter(function({sent}){
            if (sent === false) {
              return false
            }
            return true;
          }).map(({ _Id, memberId }) => (
              <div key={_Id} className="unsent-card-container">
                <p>
                  <span> ID Number: {memberId} </span>
                  <Link
                    href={`/unregistered-cards/${memberId}`}
                    className="editButton"
                  >
                    <button className="editButton">Edit</button>
                  </Link>
                </p>
              </div>
            ))
          :card
          .filter(function ({ sent }) {
            if (sent === false) {
              return false;
            }
            return true;
          })
          .map(({ _Id, memberId, sentTo }) => (
            <div key={_Id} className="unsent-card-container">
              <p>
                <span> ID Number: {memberId} |</span>
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