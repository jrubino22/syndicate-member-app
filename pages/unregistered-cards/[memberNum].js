import * as React from 'react'
import Link from 'next/link'

const SendCard = ({card}) => {
    
    const [sentTo, setSentTo] = React.useState(card[0].sentTo)
    

    const handleSentTo = (event) => {       
        setSentTo(event.target.value)
        console.log(sentTo)
    }

      async function handleFormSubmit() {
        const thisUrl = `https://syndicate-member.herokuapp.com/api/send/${urlParam}`

        try{
            console.log(thisUrl)
            await postFormDataAsJson({thisUrl})
            // alert('changes have been saved')
        }catch(error) {
            console.log(error)
        }
    }

        async function postFormDataAsJson() {
            const formDataJsonString = JSON.stringify({
                sent: true,
                sentTo: sentTo
            });
            const fetchOptions = {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: formDataJsonString,
            };
            const response = await fetch(`https://syndicate-member.herokuapp.com/api/send/${card[0].memberId}`, fetchOptions);

            if (!response.ok) {
                console.log('error in fetch')
                const errorMessage = await response.text();
                throw new Error(errorMessage);
            }
            alert("your changes have been saved")             
            return response.json()
        }
    return(
    
        card.map(({memberId}) => (
            <>
                <Link href={`/unregistered-cards`}>
                <button className="backButton">Back</button>
                </Link>
                <div className="border">
                <p className="memberPageHeader">
                    <span><span className="bold">Card Number:</span> {memberId} </span>
                </p>
                </div>   
                <div key="form" className="formDiv">
                    <h3>Send Card</h3>
                    <form className="memberForm" onSubmit={() => handleFormSubmit()}> 
                     <br></br>
                        <label>Sent To: <br></br>
                            <textarea name="sentTo" className="sendTa"  value={sentTo} onChange={handleSentTo}></textarea>
                        </label>
                        <input type="submit" value="Mark Card Sent"></input>
                    </form>        
                </div>                     
            </>      
        )))       
}

export async function getServerSideProps(props){

    const response = await fetch(`https://syndicate-member.herokuapp.com/api/unregistered/${props.query.memberNum}`)
    const data = await response.json()

    return {
        props: {
            card: data
        }
    }
}


export default SendCard