import "./styles.css";

const Index = ({member}) => {

    return(
   member.map(({customerEmail, cardTier, accountNumber}) => (
        <span border>
        <p>  
            <span> Customer Email: {customerEmail} </span>
            |<span> Membership Tier: {cardTier} </span>
            |<span> Account Number: {accountNumber} </span>         
            <button id="wb">Make Edit</button>
        </p> 
        </span>
    )))
}

export async function getServerSideProps(){
    const response = await fetch('http://localhost:5000/members')
    const data = await response.json()

    return {
        props: {
            member: data
        }
    }
}


export default Index