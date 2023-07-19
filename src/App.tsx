import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import { Id } from '../convex/_generated/dataModel'

const SelectArticle = ({select}: {select: (article: Id<"articles">) => void}) => {
  const articles = useQuery(api.article.list) ?? [];

  return (<div>
    {articles.map((article) =>
      <button onClick={() => select(article._id)}>{article.name}</button>
    )}
  </div>)
}

const NewRace = () => {
  const [clicked, setClicked] = useState(false);
  const [start, setStart] = useState<null | Id<"articles">>(null);
  const saveRace = useMutation(api.race.make)

  return <>
    {clicked ?
    (start ?
    <div>Target: <SelectArticle select={(target) => {
      void saveRace({start, target}).then(() => {
        setStart(null);
        setClicked(false);
      });
    }} />
    </div>
     : <div>Start: <SelectArticle select={setStart} /></div>
    )
    : <button onClick={() => setClicked(true)}>Make a new Race</button>
    }
  </>;
};

const CONVEX_SITE = import.meta.env.VITE_CONVEX_SITE as string;

function App() {
  const races = useQuery(api.race.list);
  const startRaceMutation = useMutation(api.path.start);

  const startRace = async (race: Id<"races">) => {
    const path = await startRaceMutation({race});
    window.location.replace(CONVEX_SITE + "/race?path=" + path);
  };

  return (
    <div className="App">
      <div>Races</div>
      {races?.map(({ _id, start, target }) => (
        <div key={_id}>
          path from {start?.name} to {target?.name}
          <button onClick={() => {void startRace(_id)}}>Start</button>
        </div>
      ))}
      <NewRace />
    </div>
  )
}

export default App
